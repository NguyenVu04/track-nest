jest.mock("expo-background-task", () => ({
  registerTaskAsync: jest.fn().mockResolvedValue(undefined),
  unregisterTaskAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("expo-task-manager", () => ({
  isTaskRegisteredAsync: jest.fn().mockResolvedValue(false),
  defineTask: jest.fn(),
}));
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestBackgroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  startLocationUpdatesAsync: jest.fn().mockResolvedValue(undefined),
  stopLocationUpdatesAsync: jest.fn().mockResolvedValue(undefined),
  hasStartedLocationUpdatesAsync: jest.fn().mockResolvedValue(true),
  Accuracy: { BestForNavigation: 6 },
}));
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("@/utils/locationMerge", () => ({
  syncLocationSamples: jest.fn().mockResolvedValue({ latest: null, queueSize: 0 }),
}));
jest.mock("@/constant", () => ({
  BACKGROUND_USER_LOCATION_TASK_NAME: "background-user-location-task",
  LOCATION_STORAGE_KEY: "@test/last_location",
  LOCATION_UPLOAD_QUEUE_KEY: "@test/upload_queue",
  LOCATION_HISTORY_KEY: "@test/history",
}));

import * as BackgroundTask from "expo-background-task";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import {
  requestPermissionsAndStart,
  stopBackgroundLocationTracking,
  registerBackgroundTaskAsync,
  unregisterBackgroundTaskAsync,
  flushNativeLocationBufferToStorage,
} from "@/utils/backgroundLocation";

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("requestPermissionsAndStart (non-Android, no native module)", () => {
  it("requests foreground then background permissions", async () => {
    await requestPermissionsAndStart();
    expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
    expect(Location.requestBackgroundPermissionsAsync).toHaveBeenCalled();
  });

  it("calls startLocationUpdatesAsync when permissions are granted", async () => {
    await requestPermissionsAndStart();
    expect(Location.startLocationUpdatesAsync).toHaveBeenCalledWith(
      "background-user-location-task",
      expect.objectContaining({ accuracy: 6 }),
    );
  });

  it("stops early when foreground permission is denied", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: "denied",
    });

    await requestPermissionsAndStart();

    expect(Location.requestBackgroundPermissionsAsync).not.toHaveBeenCalled();
    expect(Location.startLocationUpdatesAsync).not.toHaveBeenCalled();
  });

  it("stops early when background permission is denied", async () => {
    (Location.requestBackgroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: "denied",
    });

    await requestPermissionsAndStart();

    expect(Location.startLocationUpdatesAsync).not.toHaveBeenCalled();
  });
});

describe("stopBackgroundLocationTracking (non-Android, no native module)", () => {
  it("stops location updates when task is registered", async () => {
    (Location.hasStartedLocationUpdatesAsync as jest.Mock).mockResolvedValueOnce(true);

    await stopBackgroundLocationTracking();

    expect(Location.hasStartedLocationUpdatesAsync).toHaveBeenCalled();
    expect(Location.stopLocationUpdatesAsync).toHaveBeenCalledWith(
      "background-user-location-task",
    );
  });

  it("does not call stopLocationUpdatesAsync when task is not registered", async () => {
    (Location.hasStartedLocationUpdatesAsync as jest.Mock).mockResolvedValueOnce(false);

    await stopBackgroundLocationTracking();

    expect(Location.stopLocationUpdatesAsync).not.toHaveBeenCalled();
  });
});

describe("registerBackgroundTaskAsync", () => {
  it("registers the task when it is not already registered", async () => {
    (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValueOnce(false);

    await registerBackgroundTaskAsync("my-task");

    expect(BackgroundTask.registerTaskAsync).toHaveBeenCalledWith(
      "my-task",
      expect.objectContaining({ minimumInterval: 900 }),
    );
  });

  it("skips registration when the task is already registered", async () => {
    (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValueOnce(true);

    await registerBackgroundTaskAsync("my-task");

    expect(BackgroundTask.registerTaskAsync).not.toHaveBeenCalled();
  });
});

describe("unregisterBackgroundTaskAsync", () => {
  it("calls BackgroundTask.unregisterTaskAsync with the task name", async () => {
    await unregisterBackgroundTaskAsync("my-task");
    expect(BackgroundTask.unregisterTaskAsync).toHaveBeenCalledWith("my-task");
  });
});

describe("flushNativeLocationBufferToStorage (non-Android, no native module)", () => {
  it("returns 0 when native module is not available", async () => {
    const result = await flushNativeLocationBufferToStorage();
    expect(result).toBe(0);
  });
});
