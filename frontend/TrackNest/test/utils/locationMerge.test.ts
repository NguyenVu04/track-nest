jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("@/constant", () => ({
  LOCATION_STORAGE_KEY: "@test/last_location",
  LOCATION_UPLOAD_QUEUE_KEY: "@test/upload_queue",
  LOCATION_HISTORY_KEY: "@test/history",
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  normalizeLocationState,
  computeLocationMerge,
  syncLocationSamples,
  processBatchLocations,
} from "@/utils/locationMerge";
import type { LocationMergeState } from "@/utils/locationTypes";

const EMPTY: LocationMergeState = { latest: null, queue: [], history: [] };

function makeSample(overrides: Partial<{
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  timestamp: number;
}> = {}) {
  return {
    latitude: 10,
    longitude: 20,
    accuracy: 5,
    speed: 0,
    timestamp: 1_000_000,
    ...overrides,
  };
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

// ─── normalizeLocationState ────────────────────────────────────────────────────

describe("normalizeLocationState", () => {
  it("returns null when latitude is missing", () => {
    expect(normalizeLocationState({ longitude: 10 }, null)).toBeNull();
  });

  it("returns null when longitude is missing", () => {
    expect(normalizeLocationState({ latitude: 10 }, null)).toBeNull();
  });

  it("returns null when either coordinate is NaN", () => {
    expect(normalizeLocationState({ latitude: NaN, longitude: 10 }, null)).toBeNull();
    expect(normalizeLocationState({ latitude: 10, longitude: NaN }, null)).toBeNull();
  });

  it("returns null when both coordinates are NaN", () => {
    expect(normalizeLocationState({ latitude: NaN, longitude: NaN }, null)).toBeNull();
  });

  it("normalizes a complete incoming object", () => {
    const result = normalizeLocationState(
      { latitude: 1, longitude: 2, speed: 3, accuracy: 4, timestamp: 5, time_spent: 6 },
      null,
    );
    expect(result).toEqual({ latitude: 1, longitude: 2, speed: 3, accuracy: 4, timestamp: 5, time_spent: 6 });
  });

  it("falls back to previous state fields when incoming has no optional fields", () => {
    const prev = { latitude: 0, longitude: 0, speed: 5, accuracy: 10, timestamp: 999, time_spent: 50 };
    const result = normalizeLocationState({ latitude: 1, longitude: 2 }, prev);
    expect(result).toEqual({ latitude: 1, longitude: 2, speed: 5, accuracy: 10, timestamp: 999, time_spent: 50 });
  });

  it("uses null defaults when previous is null and optional fields are absent", () => {
    const result = normalizeLocationState({ latitude: 1, longitude: 2 }, null);
    expect(result).toEqual({ latitude: 1, longitude: 2, speed: null, accuracy: null, timestamp: undefined, time_spent: undefined });
  });

  it("prefers incoming values over previous state", () => {
    const prev = { latitude: 0, longitude: 0, speed: 99, accuracy: 1, timestamp: 1, time_spent: 1 };
    const result = normalizeLocationState(
      { latitude: 5, longitude: 6, speed: 7, accuracy: 8, timestamp: 9 },
      prev,
    );
    expect(result!.speed).toBe(7);
    expect(result!.accuracy).toBe(8);
    expect(result!.timestamp).toBe(9);
  });
});

// ─── computeLocationMerge ─────────────────────────────────────────────────────

describe("computeLocationMerge", () => {
  it("processes a single good-accuracy sample", () => {
    const s = makeSample();
    const result = computeLocationMerge([s], EMPTY);
    expect(result.latest).toMatchObject({ latitude: 10, longitude: 20 });
    expect(result.queue).toHaveLength(1);
    expect(result.history).toHaveLength(1);
    expect(result.queue[0].time_spent).toBe(0);
  });

  it("sorts unsorted samples by timestamp before processing", () => {
    const s1 = makeSample({ latitude: 11, timestamp: 2_000_000 });
    const s2 = makeSample({ latitude: 10, timestamp: 1_000_000 });
    const result = computeLocationMerge([s1, s2], EMPTY);
    expect(result.latest).toMatchObject({ latitude: 11 });
  });

  it("accumulates time_spent for samples at the same place", () => {
    const s1 = makeSample({ timestamp: 1_000_000 });
    const s2 = makeSample({ timestamp: 1_010_000 });
    const result = computeLocationMerge([s1, s2], EMPTY);
    expect(result.queue).toHaveLength(1);
    expect(result.queue[0].time_spent).toBe(10);
  });

  it("creates a new queue entry for a different place", () => {
    const s1 = makeSample({ latitude: 10, longitude: 20, timestamp: 1_000_000 });
    const s2 = makeSample({ latitude: 50, longitude: 80, timestamp: 2_000_000 });
    const result = computeLocationMerge([s1, s2], EMPTY);
    expect(result.queue).toHaveLength(2);
  });

  it("skips adding to queue/history for poor-accuracy samples", () => {
    const s = makeSample({ accuracy: 100 }); // > 50 → poor
    const result = computeLocationMerge([s], EMPTY);
    expect(result.queue).toHaveLength(0);
    expect(result.history).toHaveLength(0);
    expect(result.latest).toMatchObject({ latitude: 10, longitude: 20 });
  });

  it("accumulates time_spent on latest for poor-accuracy samples", () => {
    const s1 = makeSample({ accuracy: 100, timestamp: 1_000_000 });
    const s2 = makeSample({ accuracy: 100, timestamp: 1_060_000 });
    const result = computeLocationMerge([s1, s2], EMPTY);
    expect(result.latest!.time_spent).toBeGreaterThan(0);
    expect(result.queue).toHaveLength(0);
  });

  it("uses initial.latest.timestamp as the baseline when provided", () => {
    const initial: LocationMergeState = {
      latest: { latitude: 10, longitude: 20, speed: 0, timestamp: 900_000, time_spent: 0 },
      queue: [],
      history: [],
    };
    const s = makeSample({ timestamp: 1_000_000 });
    const result = computeLocationMerge([s], initial);
    // Delta = (1_000_000 - 900_000) / 1000 = 100s; accumulated on latest (same place)
    expect(result.latest!.time_spent).toBe(100);
    // A fresh queue entry always starts with time_spent: 0
    expect(result.queue[0].time_spent).toBe(0);
  });

  it("processes an empty samples array without modification", () => {
    const s = makeSample({ timestamp: 1_000_000 });
    const initial = computeLocationMerge([s], EMPTY);
    const result = computeLocationMerge([], initial);
    expect(result).toEqual(initial);
  });
});

// ─── syncLocationSamples ──────────────────────────────────────────────────────

describe("syncLocationSamples", () => {
  it("returns queueSize 0 and stored latest when samples are empty", async () => {
    const stored = { latitude: 5, longitude: 6, speed: 0 };
    await AsyncStorage.setItem("@test/last_location", JSON.stringify(stored));
    const result = await syncLocationSamples([]);
    expect(result.queueSize).toBe(0);
    expect(result.latest).toMatchObject({ latitude: 5, longitude: 6 });
  });

  it("persists new samples and returns latest + queueSize", async () => {
    const s = makeSample({ timestamp: Date.now() });
    const result = await syncLocationSamples([s]);
    expect(result.queueSize).toBe(1);
    expect(result.latest).toMatchObject({ latitude: 10, longitude: 20 });
  });

  it("merges new samples with existing stored state", async () => {
    const s1 = makeSample({ timestamp: 1_000_000 });
    await syncLocationSamples([s1]);

    const s2 = makeSample({ latitude: 50, longitude: 60, timestamp: 2_000_000 });
    const result = await syncLocationSamples([s2]);

    expect(result.queueSize).toBe(2);
    expect(result.latest).toMatchObject({ latitude: 50, longitude: 60 });
  });
});

// ─── processBatchLocations ────────────────────────────────────────────────────

describe("processBatchLocations", () => {
  it("converts LocationObject format and syncs samples", async () => {
    const locationObjects = [
      {
        coords: { latitude: 21, longitude: 105, accuracy: 5, speed: 1 },
        timestamp: Date.now(),
      },
    ];
    const result = await processBatchLocations(locationObjects as any);
    expect(result.queueSize).toBe(1);
    expect(result.latest).toMatchObject({ latitude: 21, longitude: 105 });
  });

  it("handles null accuracy and speed gracefully", async () => {
    const locationObjects = [
      {
        coords: { latitude: 10, longitude: 20, accuracy: null, speed: null },
        timestamp: Date.now(),
      },
    ];
    const result = await processBatchLocations(locationObjects as any);
    expect(result.latest).toMatchObject({ latitude: 10, longitude: 20 });
  });
});
