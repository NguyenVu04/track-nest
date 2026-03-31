import { LOCATION_UPLOAD_QUEUE_KEY, SHARE_LOCATION_KEY } from "@/constant";
import { updateUserLocation } from "@/services/tracker";
import {
  flushNativeLocationBufferToStorage,
  isAuthUnavailableError,
  loadSavedKey,
  saveKey,
} from "@/utils";
import { scheduleUploadStatusNotification } from "@/utils/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type LocationQueueEntry = {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  timestamp: number;
};

export type LocationUploadStatus =
  | "success"
  | "failed"
  | "no_network"
  | "auth_paused"
  | "empty";

export type LocationUploadResult = {
  status: LocationUploadStatus;
  uploaded: number;
  failed: number;
  reason?: string;
};

export function isNetworkError(err: any): boolean {
  if (!err) return false;
  if (err.code === 14) return true;
  const msg = (err.message ?? "").toLowerCase();
  return (
    msg.includes("network request failed") ||
    msg.includes("failed to fetch") ||
    msg.includes("fetch failed") ||
    msg.includes("econnrefused") ||
    msg.includes("etimedout") ||
    msg.includes("enotfound") ||
    msg.includes("no internet") ||
    msg.includes("network error")
  );
}

export async function uploadPendingLocations(
  notify = true,
): Promise<LocationUploadResult> {
  try {
    const shareLocationEnabled =
      (await AsyncStorage.getItem(SHARE_LOCATION_KEY)) === "true";
    if (!shareLocationEnabled) {
      console.log("Upload task: sharing location is disabled.");
      return { status: "empty", uploaded: 0, failed: 0 };
    }

    await flushNativeLocationBufferToStorage();

    const queue = await loadSavedKey<LocationQueueEntry[]>(
      LOCATION_UPLOAD_QUEUE_KEY,
    );

    if (!queue || queue.length === 0) {
      console.log("Upload task: no pending locations.");
      return { status: "empty", uploaded: 0, failed: 0 };
    }

    console.log(`Upload task: uploading ${queue.length} location(s)...`);

    const locations = queue.map((entry) => ({
      latitudeDeg: entry.latitude,
      longitudeDeg: entry.longitude,
      accuracyMeter: entry.accuracy,
      velocityMps: entry.speed,
      timestampMs: entry.timestamp,
    }));

    try {
      await updateUserLocation(locations);
      await saveKey(LOCATION_UPLOAD_QUEUE_KEY, []);
      console.log("Upload task: queue flushed.");

      if (notify) {
        await scheduleUploadStatusNotification(
          "success",
          `${queue.length} location update(s) uploaded to server.`,
        );
      }

      return { status: "success", uploaded: queue.length, failed: 0 };
    } catch (err: any) {
      if (isAuthUnavailableError(err)) {
        if (notify) {
          await scheduleUploadStatusNotification(
            "failed",
            "Token unavailable. Upload is paused and will retry after login.",
          );
        }

        return {
          status: "auth_paused",
          uploaded: 0,
          failed: queue.length,
          reason: err.message,
        };
      }

      if (isNetworkError(err)) {
        if (notify) {
          await scheduleUploadStatusNotification(
            "no_network",
            `No internet connection. ${queue.length} update(s) pending.`,
          );
        }
        console.warn("Upload task: network unavailable.");

        return {
          status: "no_network",
          uploaded: 0,
          failed: queue.length,
        };
      }

      console.error("Upload task failed:", err.message);

      if (notify) {
        await scheduleUploadStatusNotification(
          "failed",
          err.message ? `Reason: ${err.message}` : undefined,
        );
      }

      return {
        status: "failed",
        uploaded: 0,
        failed: queue.length,
        reason: err?.message,
      };
    }
  } catch (err: any) {
    console.error("Upload task failed:", err.message);

    if (notify) {
      if (isNetworkError(err)) {
        await scheduleUploadStatusNotification(
          "no_network",
          "No internet connection. Updates will be retried automatically.",
        );
      } else {
        await scheduleUploadStatusNotification(
          "failed",
          err.message ? `Reason: ${err.message}` : undefined,
        );
      }
    }

    return {
      status: isNetworkError(err) ? "no_network" : "failed",
      uploaded: 0,
      failed: 0,
      reason: err?.message,
    };
  }
}
