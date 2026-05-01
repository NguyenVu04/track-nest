import { BACKGROUND_USER_LOCATION_TASK_NAME } from "@/constant";
import * as BackgroundTask from "expo-background-task";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { NativeModules, Platform } from "react-native";
import { syncLocationSamples } from "./locationMerge";
import { StoredLocationEntry } from "./locationTypes";

// ─── Native module bridge (Android only) ──────────────────────────────────────

type NativeLocationModuleType = {
  start: () => void;
  stop: () => void;
  consumeBufferedLocations: () => Promise<string>;
};

const nativeModule =
  Platform.OS === "android"
    ? (NativeModules.NativeLocationModule as NativeLocationModuleType | undefined)
    : undefined;

// ─── Permissions + tracking lifecycle ─────────────────────────────────────────

export async function requestPermissionsAndStart(): Promise<void> {
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== "granted") return;

  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== "granted") return;

  if (nativeModule?.start) {
    nativeModule.start();
  } else {
    await Location.startLocationUpdatesAsync(BACKGROUND_USER_LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      mayShowUserSettingsDialog: true,
      foregroundService: {
        notificationTitle: "TrackNest is tracking your location",
        notificationBody: "",
        notificationColor: "#74becb",
        killServiceOnDestroy: false,
      },
      timeInterval: 5000,
      distanceInterval: 10,
      showsBackgroundLocationIndicator: true,
    });
  }
}

export async function stopBackgroundLocationTracking(): Promise<void> {
  if (nativeModule?.stop) {
    nativeModule.stop();
    return;
  }

  const isRegistered = await Location.hasStartedLocationUpdatesAsync(
    BACKGROUND_USER_LOCATION_TASK_NAME,
  );
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_USER_LOCATION_TASK_NAME);
  }
}

// ─── Background task registration ─────────────────────────────────────────────

export async function registerBackgroundTaskAsync(taskName: string): Promise<void> {
  const isAlreadyRegistered = await TaskManager.isTaskRegisteredAsync(taskName);
  if (isAlreadyRegistered) return;

  await BackgroundTask.registerTaskAsync(taskName, {
    minimumInterval: 15 * 60,
  });
}

export async function unregisterBackgroundTaskAsync(taskName: string): Promise<void> {
  return BackgroundTask.unregisterTaskAsync(taskName);
}

// ─── Native location buffer ────────────────────────────────────────────────────
// Drains the SharedPreferences buffer written by NativeLocationService,
// validates the entries, then syncs them into AsyncStorage.

export async function flushNativeLocationBufferToStorage(): Promise<number> {
  if (!nativeModule?.consumeBufferedLocations) return 0;

  try {
    const payload = await nativeModule.consumeBufferedLocations();
    const parsed = JSON.parse(payload || "[]") as StoredLocationEntry[];

    if (!Array.isArray(parsed) || parsed.length === 0) return 0;

    const valid = parsed
      .filter(
        (item) =>
          Number.isFinite(item.latitude) &&
          Number.isFinite(item.longitude) &&
          Number.isFinite(item.timestamp),
      )
      .map((item) => ({
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        accuracy: Number.isFinite(item.accuracy) ? Number(item.accuracy) : 0,
        speed: Number.isFinite(item.speed) ? Number(item.speed) : 0,
        timestamp: Number(item.timestamp),
      }));

    if (valid.length === 0) return 0;

    await syncLocationSamples(valid);
    return valid.length;
  } catch (error) {
    console.warn("Failed to flush native location buffer:", error);
    return 0;
  }
}
