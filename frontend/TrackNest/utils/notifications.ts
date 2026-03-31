import { LOCATION_UPLOAD_CHANNEL_ID } from "@/constant";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * Sets the global notification handler that controls how notifications
 * are presented when the app is in the foreground.
 */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Creates the default Android notification channel required for FCM
 * notifications on Android 8+.
 */
export async function setupNotificationChannels() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }
}

/**
 * Requests notification permissions and returns the native FCM device
 * push token. This token should be sent to the backend for FCM delivery.
 */
export async function registerForPushNotificationsAsync(): Promise<
  string | undefined
> {
  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device");
    return;
  }

  await setupNotificationChannels();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Notification permission not granted");
    return;
  }

  // Get the native FCM token (Android) / APNs token (iOS)
  const { data: token } = await Notifications.getDevicePushTokenAsync();
  console.log("FCM device token:", token);
  return token;
}

/**
 * Creates the Android notification channel used for crash / impact alerts.
 * Safe to call multiple times — Android ignores duplicate channel creation.
 */
export async function setupCrashNotificationChannel(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("crash-detection", {
      name: "Crash Detection",
      description: "Alerts when a sudden impact or crash is detected",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 200, 500],
      enableVibrate: true,
      sound: "default",
    });
  }
}

/**
 * Schedules an immediate local notification visible to the user.
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch (err) {
    console.warn("Failed to schedule local notification:", err);
  }
}

/**
 * Schedules an immediate local notification that is automatically dismissed
 * after `durationMs` milliseconds (default 4 seconds).
 */
export async function scheduleAutoDisappearNotification(
  title: string,
  body: string,
  durationMs = 4000,
): Promise<void> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
    setTimeout(() => {
      Notifications.dismissNotificationAsync(id).catch(() => {});
    }, durationMs);
  } catch (err) {
    console.warn("Failed to schedule auto-disappear notification:", err);
  }
}

/**
 * Creates the Android notification channel used for background upload status
 * alerts (no-network, success, failure).
 * Safe to call multiple times — Android ignores duplicate channel creation.
 */
export async function setupUploadNotificationChannel(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(
      LOCATION_UPLOAD_CHANNEL_ID,
      {
        name: "Location Upload",
        description: "Status of background location uploads to the server",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 150],
        enableVibrate: false,
        sound: undefined,
      },
    );
  }
}

export type UploadNotificationStatus = "success" | "no_network" | "failed";

/**
 * Schedules a status notification for the background location upload task.
 *
 * @param status  - "success" | "no_network" | "failed"
 * @param detail  - Optional extra context shown in the notification body.
 */
export async function scheduleUploadStatusNotification(
  status: UploadNotificationStatus,
  detail?: string,
): Promise<void> {
  let title: string;
  let body: string;

  switch (status) {
    case "success":
      title = "Location Synced";
      body = detail ?? "Location updates uploaded to server.";
      break;
    case "no_network":
      title = "Upload Skipped — No Network";
      body =
        detail ??
        "No internet connection. Updates will be retried automatically.";
      break;
    case "failed":
      title = "Upload Failed";
      body =
        detail ??
        "Could not upload location updates. Will retry automatically.";
      break;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        ...(Platform.OS === "android" && {
          channelId: LOCATION_UPLOAD_CHANNEL_ID,
        }),
      },
      trigger: null,
    });
  } catch (err) {
    console.warn("Failed to schedule upload status notification:", err);
  }
}
