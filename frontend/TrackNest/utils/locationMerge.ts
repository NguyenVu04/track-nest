import {
  LOCATION_HISTORY_KEY,
  LOCATION_STORAGE_KEY,
  LOCATION_UPLOAD_QUEUE_KEY,
} from "@/constant";
import { LocationState } from "@/constant/types";
import { loadSavedKey, saveKey } from "@/utils/storage";
import type { LocationObject } from "expo-location";
import { isSamePlace, isPoorAccuracy } from "./locationGeometry";
import {
  LocationMergeState,
  StoredLatestLocation,
  StoredLocationEntry,
} from "./locationTypes";

// ─── Normalization ─────────────────────────────────────────────────────────────
// Bridges a partial/raw location payload into a fully-typed LocationState,
// carrying forward fields from the previous state when absent in the incoming one.

export function normalizeLocationState(
  incoming: Partial<LocationState>,
  previous: LocationState | null,
): LocationState | null {
  if (!Number.isFinite(incoming.latitude) || !Number.isFinite(incoming.longitude)) {
    return null;
  }
  return {
    latitude: incoming.latitude as number,
    longitude: incoming.longitude as number,
    speed: incoming.speed ?? previous?.speed ?? null,
    accuracy: incoming.accuracy ?? previous?.accuracy ?? null,
    timestamp: incoming.timestamp ?? previous?.timestamp,
    time_spent: incoming.time_spent ?? previous?.time_spent,
  };
}

// ─── Pure merge computation ────────────────────────────────────────────────────
// No I/O. Given a sorted batch of samples and an initial state, returns the
// next state. Safe to call in tests without mocking AsyncStorage.

function upsertEntry(
  list: StoredLocationEntry[],
  sample: StoredLocationEntry,
  deltaSeconds: number,
): StoredLocationEntry[] {
  const last = list[list.length - 1];
  if (last && isSamePlace(last, sample)) {
    return [
      ...list.slice(0, -1),
      {
        ...last,
        time_spent: (last.time_spent ?? 0) + Math.max(0, deltaSeconds),
        // Keep the original arrival timestamp as a stable key.
        // The native upload path uses the same stay-start timestamp so both
        // paths resolve to the same (user_id, timestamp) PK — enabling a DB
        // UPSERT instead of duplicate INSERTs.
      },
    ];
  }
  return [...list, { ...sample, time_spent: 0 }];
}

function applyOneSample(
  state: LocationMergeState,
  sample: StoredLocationEntry,
  deltaSeconds: number,
): LocationMergeState {
  const { latest, queue, history } = state;

  if (isPoorAccuracy(sample.accuracy)) {
    // Poor accuracy: update the displayed position and accumulate time but
    // do not commit a new entry to the upload queue or history.
    return {
      latest: {
        latitude: sample.latitude,
        longitude: sample.longitude,
        speed: latest?.speed ?? sample.speed,
        timestamp: sample.timestamp,
        time_spent: (latest?.time_spent ?? 0) + deltaSeconds,
      },
      queue,
      history,
    };
  }

  const nextLatest: StoredLatestLocation =
    latest && isSamePlace(latest, sample)
      ? {
          ...latest,
          latitude: sample.latitude,
          longitude: sample.longitude,
          speed: sample.speed,
          timestamp: sample.timestamp,
          time_spent: (latest.time_spent ?? 0) + deltaSeconds,
        }
      : {
          latitude: sample.latitude,
          longitude: sample.longitude,
          speed: sample.speed,
          timestamp: sample.timestamp,
          time_spent: 0,
        };

  return {
    latest: nextLatest,
    queue: upsertEntry(queue, sample, deltaSeconds),
    history: upsertEntry(history, sample, deltaSeconds),
  };
}

export function computeLocationMerge(
  samples: StoredLocationEntry[],
  initial: LocationMergeState,
): LocationMergeState {
  const sorted = [...samples].sort((a, b) => a.timestamp - b.timestamp);
  let prevTimestamp = initial.latest?.timestamp ?? sorted[0].timestamp;
  let state = initial;

  for (const sample of sorted) {
    const deltaSeconds = Math.max(
      0,
      Math.floor((sample.timestamp - prevTimestamp) / 1000),
    );
    prevTimestamp = sample.timestamp;
    state = applyOneSample(state, sample, deltaSeconds);
  }

  return state;
}

// ─── Storage orchestration ─────────────────────────────────────────────────────
// Loads state from AsyncStorage, runs the pure merge, then persists the result.

export async function syncLocationSamples(
  samples: StoredLocationEntry[],
): Promise<{ latest: StoredLatestLocation | null; queueSize: number }> {
  if (!samples.length) {
    const latest = await loadSavedKey<StoredLatestLocation>(LOCATION_STORAGE_KEY);
    return { latest, queueSize: 0 };
  }

  const [latestStored, queue, history] = await Promise.all([
    loadSavedKey<StoredLatestLocation>(LOCATION_STORAGE_KEY),
    loadSavedKey<StoredLocationEntry[]>(LOCATION_UPLOAD_QUEUE_KEY).then((v) => v ?? []),
    loadSavedKey<StoredLocationEntry[]>(LOCATION_HISTORY_KEY).then((v) => v ?? []),
  ]);

  const { latest, queue: nextQueue, history: nextHistory } = computeLocationMerge(
    samples,
    { latest: latestStored, queue, history },
  );

  await Promise.all([
    latest
      ? saveKey<StoredLatestLocation>(LOCATION_STORAGE_KEY, latest)
      : Promise.resolve(),
    saveKey(LOCATION_UPLOAD_QUEUE_KEY, nextQueue),
    saveKey(LOCATION_HISTORY_KEY, nextHistory),
  ]);

  return { latest, queueSize: nextQueue.length };
}

// Adapter for the Expo LocationObject format used by the background task.
export async function processBatchLocations(
  locationObjects: LocationObject[],
): Promise<{ latest: StoredLatestLocation | null; queueSize: number }> {
  const samples = locationObjects.map((loc) => ({
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    accuracy: loc.coords.accuracy ?? 0,
    speed: loc.coords.speed ?? 0,
    timestamp: loc.timestamp,
  }));
  return syncLocationSamples(samples);
}
