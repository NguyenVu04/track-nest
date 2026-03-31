import {
  BACKGROUND_CIRCLE_LOCATION_TASK_NAME,
  BACKGROUND_LOCATION_UPLOAD_TASK_NAME,
  BACKGROUND_USER_LOCATION_TASK_NAME,
  LOCATION_UPDATE_EMIT_EVENT,
} from "@/constant";
import { uploadPendingLocations } from "@/services/locationUpload";
import { mergeBackgroundLocationsWithTimeSpent } from "@/utils";
import { scheduleAutoDisappearNotification } from "@/utils/notifications";
import * as BackgroundTask from "expo-background-task";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { DeviceEventEmitter } from "react-native";

// Background location task — saves location to device storage only.
// The upload background task is responsible for syncing to the server.
TaskManager.defineTask(
  BACKGROUND_USER_LOCATION_TASK_NAME,
  async ({ data, error }) => {
    if (error) {
      console.error("Location task error:", error);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }

    const locations = (data as { locations?: Location.LocationObject[] })
      ?.locations;
    console.log("Received new locations", locations, locations?.length);

    if (locations && locations.length > 0) {
      try {
        const { latest, queueSize } =
          await mergeBackgroundLocationsWithTimeSpent(locations);

        if (!latest) {
          return;
        }

        console.log(
          "Timestamp:",
          new Date(latest.timestamp ?? Date.now()).toLocaleString(),
        );

        // Notify any in-app subscribers with latest computed location
        DeviceEventEmitter.emit(LOCATION_UPDATE_EMIT_EVENT, {
          latitude: latest.latitude,
          longitude: latest.longitude,
          speed: latest.speed,
        });

        console.log(
          `Location processed for upload (queue size: ${queueSize}).`,
        );
        await scheduleAutoDisappearNotification(
          "Location Recorded",
          `Position saved · ${queueSize} update(s) pending upload.`,
        );
        return BackgroundTask.BackgroundTaskResult.Success;
      } catch (err: any) {
        console.error("Error saving location in background:", err.message);
        await scheduleAutoDisappearNotification(
          "Location Error",
          "Failed to record your current position.",
        );
        return BackgroundTask.BackgroundTaskResult.Failed;
      }
    }
  },
);

// Background upload task — reads the pending location queue and syncs to the
// server. Return Success for transient no-network results to avoid scheduler
// backoff while retaining pending queue entries for next retry window.
TaskManager.defineTask(BACKGROUND_LOCATION_UPLOAD_TASK_NAME, async () => {
  console.log("[Background] Upload task started at", new Date().toISOString());
  const result = await uploadPendingLocations(true);

  switch (result.status) {
    case "success":
      await scheduleAutoDisappearNotification(
        "Location Upload Complete",
        `${result.uploaded} location(s) uploaded successfully.`,
      );
      break;
    case "empty":
      break;
    case "no_network":
      await scheduleAutoDisappearNotification(
        "Upload Pending",
        `No network. ${result.failed} location(s) waiting to upload.`,
      );
      break;
    case "auth_paused":
      await scheduleAutoDisappearNotification(
        "Upload Paused",
        "Authentication required. Upload will resume after login.",
      );
      break;
    case "failed":
      await scheduleAutoDisappearNotification(
        "Upload Failed",
        result.reason ?? "Unknown error occurred.",
      );
      break;
  }

  console.log("[Background] Upload task completed with status:", result.status, result);

  return result.status === "failed"
    ? BackgroundTask.BackgroundTaskResult.Failed
    : BackgroundTask.BackgroundTaskResult.Success;
});

// Background circle location task definition
TaskManager.defineTask(BACKGROUND_CIRCLE_LOCATION_TASK_NAME, async () => {
  try {
    const now = Date.now();
    console.log(
      `Got background task call at date: ${new Date(now).toISOString()}`,
    );
  } catch (error) {
    console.error("Failed to execute the background task:", error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
  return BackgroundTask.BackgroundTaskResult.Success;
});
