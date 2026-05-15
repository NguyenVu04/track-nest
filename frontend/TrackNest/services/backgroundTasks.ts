import {
  BACKGROUND_CIRCLE_LOCATION_TASK_NAME,
  BACKGROUND_LOCATION_UPLOAD_TASK_NAME,
  BACKGROUND_NOTIFICATION_TASK_NAME,
  BACKGROUND_USER_LOCATION_TASK_NAME,
  CHAT_UNREAD_KEY,
  LOCATION_UPDATE_EMIT_EVENT,
} from "@/constant";
import { uploadPendingLocations } from "@/services/locationUpload";
import { processBatchLocations } from "@/utils";
import { scheduleAutoDisappearNotification } from "@/utils/notifications";
import { subscribeToActivityChanges, getCurrentActivity } from "@/utils/activityDetection";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundTask from "expo-background-task";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { DeviceEventEmitter } from "react-native";

subscribeToActivityChanges((activity) => {
  /* console.log("User activity changed to:", activity) */;
});

// Background location task — saves location to device storage only.
TaskManager.defineTask(
  BACKGROUND_USER_LOCATION_TASK_NAME,
  async ({ data, error }) => {
    if (error) {
      console.error("Location task error:", error);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }

    const locations = (data as { locations?: Location.LocationObject[] })
      ?.locations;
    /* console.log("Received new locations", locations, locations?.length) */;

    if (locations && locations.length > 0) {
      try {
        const { latest, queueSize } =
          await processBatchLocations(locations);

        if (!latest) {
          return;
        }

        /* console.log(
          "Timestamp:",
          new Date(latest.timestamp ?? Date.now()).toLocaleString(),
        ) */;

        // Notify any in-app subscribers with latest computed location
        DeviceEventEmitter.emit(LOCATION_UPDATE_EMIT_EVENT, {
          latitude: latest.latitude,
          longitude: latest.longitude,
          speed: latest.speed,
        });

        /* console.log(
          `Location processed for upload (queue size: ${queueSize}).`,
        ) */;
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
  /* console.log("[Background] Upload task started at", new Date().toISOString()) */;
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

  /* console.log("[Background] Upload task completed with status:", result.status, result) */;

  return result.status === "failed"
    ? BackgroundTask.BackgroundTaskResult.Failed
    : BackgroundTask.BackgroundTaskResult.Success;
});

// Handle FCM data messages (data-only, no notification field) received while
// the app is backgrounded or killed. Increments the persisted chat badge count
// so the tab bar shows the correct number when the app next opens.
// Note: FCM messages that include a notification field are displayed by the OS
// automatically on Android — this task does NOT run for those. For those cases,
// the badge syncs when useChatStream initialises and the stream reconnects.
TaskManager.defineTask(
  BACKGROUND_NOTIFICATION_TASK_NAME,
  async ({ data, error }: { data: { notification: Notifications.Notification } | null; error: any }) => {
    if (error) {
      console.error("[BackgroundNotification] task error:", error);
      return;
    }

    const notifData = data?.notification?.request?.content?.data;

    if (notifData?.type === "chat_message") {
      try {
        const stored = await AsyncStorage.getItem(CHAT_UNREAD_KEY);
        const next = (parseInt(stored ?? "0", 10) || 0) + 1;
        await AsyncStorage.setItem(CHAT_UNREAD_KEY, String(next));
      } catch (err) {
        console.error("[BackgroundNotification] failed to update badge:", err);
      }
      return;
    }

    const EMERGENCY_TYPES = [
      "EMERGENCY_REQUEST_ASSIGNED",
      "EMERGENCY_REQUEST_ACCEPTED",
      "EMERGENCY_REQUEST_REJECTED",
      "EMERGENCY_REQUEST_CLOSED",
    ];
    if (notifData?.type && EMERGENCY_TYPES.includes(notifData.type as string)) {
      // OS auto-displays the notification (FCM includes notification field).
      // Store latest emergency event so the SOS screen can refresh on next open.
      try {
        await AsyncStorage.setItem("LAST_EMERGENCY_NOTIFICATION_TYPE", notifData.type as string);
        await AsyncStorage.setItem("LAST_EMERGENCY_NOTIFICATION_TIME", String(Date.now()));
      } catch (err) {
        console.error("[BackgroundNotification] failed to store emergency notification:", err);
      }
      return;
    }
  },
);

// Background circle location task definition
TaskManager.defineTask(BACKGROUND_CIRCLE_LOCATION_TASK_NAME, async () => {
  try {
    const now = Date.now();
    /* console.log(
      `Got background task call at date: ${new Date(now).toISOString()}`,
    ) */;
  } catch (error) {
    console.error("Failed to execute the background task:", error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
  return BackgroundTask.BackgroundTaskResult.Success;
});
