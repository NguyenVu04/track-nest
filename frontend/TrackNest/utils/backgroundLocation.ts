import { BACKGROUND_USER_LOCATION_TASK_NAME } from "@/constant";
import * as BackgroundTask from "expo-background-task";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { NativeModules, Platform } from "react-native";
import { mergeStoredLocationSamplesWithTimeSpent } from "./locationMerge";
import { StoredLocationEntry } from "./locationTypes";

type NativeLocationModule = {
  start: () => void;
  stop: () => void;
  consumeBufferedLocations: () => Promise<string>;
};

const nativeLocationModule =
  Platform.OS === "android"
    ? (NativeModules.NativeLocationModule as NativeLocationModule | undefined)
    : undefined;

export async function requestPermissionsAndStart() {
  const { status: fgStatus } =
    await Location.requestForegroundPermissionsAsync();

  if (fgStatus !== "granted") {
    return;
  }

  const { status: bgStatus } =
    await Location.requestBackgroundPermissionsAsync();

  if (bgStatus !== "granted") {
    return;
  }

  if (Platform.OS === "android" && nativeLocationModule?.start) {
    nativeLocationModule.start();
  } else {
    await Location.startLocationUpdatesAsync(
      BACKGROUND_USER_LOCATION_TASK_NAME,
      {
        accuracy: Location.Accuracy.BestForNavigation,
        mayShowUserSettingsDialog: true,
        // Foreground service notification shown while tracking in background
        foregroundService: {
          notificationTitle: "TrackNest is tracking your location",
          notificationBody: "",
          notificationColor: "#74becb",
          killServiceOnDestroy: false,
        },
        timeInterval: 5000, // milliseconds - update every 5 seconds
        distanceInterval: 10, // meters - update after 10m movement
        showsBackgroundLocationIndicator: true,
      },
    );
  }
}

export async function stopBackgroundLocationTracking() {
  if (Platform.OS === "android" && nativeLocationModule?.stop) {
    nativeLocationModule.stop();
    console.log("Native background location tracking stopped.");
    return;
  }

  const isRegistered = await Location.hasStartedLocationUpdatesAsync(
    BACKGROUND_USER_LOCATION_TASK_NAME,
  );
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_USER_LOCATION_TASK_NAME);
    console.log("Background location tracking stopped.");
  }
}

export async function registerBackgroundTaskAsync(taskName: string) {
  console.log(`Registering background task: ${taskName}`);

  const status = await BackgroundTask.getStatusAsync();
  const isAlreadyRegistered = await TaskManager.isTaskRegisteredAsync(taskName);

  console.log(
    `Background task status: ${status}, alreadyRegistered: ${isAlreadyRegistered}`,
  );

  if (isAlreadyRegistered) {
    return;
  }

  await BackgroundTask.registerTaskAsync(taskName, {
    minimumInterval: 15 * 60, // 15 minutes
  });

  const isRegisteredAfter = await TaskManager.isTaskRegisteredAsync(taskName);
  console.log(`Background task registered (${taskName}): ${isRegisteredAfter}`);
}

// 3. (Optional) Unregister tasks by specifying the task name
// This will cancel any future background task calls that match the given name
// Note: This does NOT need to be in the global scope and CAN be used in your React components!
export async function unregisterBackgroundTaskAsync(taskName: string) {
  console.log(`Unregistering background task: ${taskName}`);
  return BackgroundTask.unregisterTaskAsync(taskName);
}

export async function flushNativeLocationBufferToStorage(): Promise<number> {
  if (
    !(
      Platform.OS === "android" &&
      nativeLocationModule?.consumeBufferedLocations
    )
  ) {
    return 0;
  }

  try {
    const payload = await nativeLocationModule.consumeBufferedLocations();
    const parsed = JSON.parse(payload || "[]") as StoredLocationEntry[];

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return 0;
    }

    const validSamples = parsed
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

    if (validSamples.length === 0) {
      return 0;
    }

    await mergeStoredLocationSamplesWithTimeSpent(validSamples);
    return validSamples.length;
  } catch (error) {
    console.warn("Failed to flush native location buffer:", error);
    return 0;
  }
}
