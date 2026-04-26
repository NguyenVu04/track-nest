import {
  LOCATION_HISTORY_KEY,
  LOCATION_STORAGE_KEY,
  LOCATION_UPLOAD_QUEUE_KEY,
} from "@/constant";
import { loadSavedKey, saveKey } from "@/utils/storage";
import type { LocationObject } from "expo-location";
import { StoredLatestLocation, StoredLocationEntry } from "./locationTypes";

const STAY_RADIUS_METERS = 100;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const earthRadius = 6371000;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const haversine =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return earthRadius * c;
}

function isSamePlace(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  return distanceMeters(a, b) <= STAY_RADIUS_METERS;
}

function upsertLocationEntry(
  list: StoredLocationEntry[],
  sample: StoredLocationEntry,
  deltaSeconds: number,
) {
  const last = list[list.length - 1];
  if (last && isSamePlace(last, sample)) {
    last.time_spent = (last.time_spent ?? 0) + Math.max(0, deltaSeconds);
    return;
  }
  list.push({ ...sample, time_spent: 0 });
}

export async function mergeStoredLocationSamplesWithTimeSpent(
  samples: StoredLocationEntry[],
): Promise<{ latest: StoredLatestLocation | null; queueSize: number }> {
  if (!samples.length) {
    const current =
      await loadSavedKey<StoredLatestLocation>(LOCATION_STORAGE_KEY);
    return { latest: current, queueSize: 0 };
  }

  const sortedSamples = [...samples].sort((a, b) => a.timestamp - b.timestamp);

  const latestStored =
    await loadSavedKey<StoredLatestLocation>(LOCATION_STORAGE_KEY);
  const queue =
    (await loadSavedKey<StoredLocationEntry[]>(LOCATION_UPLOAD_QUEUE_KEY)) ??
    [];
  const history =
    (await loadSavedKey<StoredLocationEntry[]>(LOCATION_HISTORY_KEY)) ?? [];

  let latest: StoredLatestLocation | null = latestStored;
  let previousTimestamp = latestStored?.timestamp ?? sortedSamples[0].timestamp;

  for (const sample of sortedSamples) {
    const deltaSeconds = Math.max(
      0,
      Math.floor((sample.timestamp - previousTimestamp) / 1000),
    );
    previousTimestamp = sample.timestamp;

    if (latest && isSamePlace(latest, sample)) {
      latest = {
        ...latest,
        speed: sample.speed,
        timestamp: sample.timestamp,
        time_spent: (latest.time_spent ?? 0) + deltaSeconds,
      };
    } else {
      latest = {
        latitude: sample.latitude,
        longitude: sample.longitude,
        speed: sample.speed,
        timestamp: sample.timestamp,
        time_spent: 0,
      };
    }

    upsertLocationEntry(queue, sample, deltaSeconds);
    upsertLocationEntry(history, sample, deltaSeconds);
  }

  if (latest) {
    await saveKey<StoredLatestLocation>(LOCATION_STORAGE_KEY, latest);
  }
  await saveKey(LOCATION_UPLOAD_QUEUE_KEY, queue);
  await saveKey(LOCATION_HISTORY_KEY, history);

  return { latest, queueSize: queue.length };
}

export async function mergeBackgroundLocationsWithTimeSpent(
  locationObjects: LocationObject[],
): Promise<{ latest: StoredLatestLocation | null; queueSize: number }> {
  const samples = locationObjects.map((item) => ({
    latitude: item.coords.latitude,
    longitude: item.coords.longitude,
    accuracy: item.coords.accuracy ?? 0,
    speed: item.coords.speed ?? 0,
    timestamp: item.timestamp,
  }));

  return mergeStoredLocationSamplesWithTimeSpent(samples);
}
