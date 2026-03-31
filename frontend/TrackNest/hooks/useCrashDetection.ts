import {
  CRASH_DETECTION_CHANNEL_ID,
  CRASH_DETECTION_THRESHOLD,
  CRASH_NOTIFICATION_COOLDOWN_MS,
} from "@/constant";
import { setupCrashNotificationChannel } from "@/utils/notifications";
import * as Notifications from "expo-notifications";
import { Accelerometer } from "expo-sensors";
import { useEffect, useRef } from "react";
import { NativeModules, Platform } from "react-native";

type CrashDetectionNativeModule = {
  start: (threshold: number, cooldownMs: number) => void;
  stop: () => void;
};

const nativeCrashDetection = NativeModules.CrashDetectionModule as
  | CrashDetectionNativeModule
  | undefined;

/**
 * Subscribes to the device accelerometer and fires a local notification
 * whenever a sudden impact (crash) is detected.
 *
 * Detection algorithm:
 *  - Compute total magnitude: √(x² + y² + z²)
 *  - At rest the magnitude is ~1 (gravity only).
 *  - A magnitude ≥ CRASH_DETECTION_THRESHOLD (default 3g) indicates a
 *    significant impact.
 *  - A cooldown prevents duplicate notifications for the same event.
 *
 * Background note: the accelerometer subscription remains active while the
 * React Native JS thread is running. On Android the thread may be suspended
 * when the app is fully backgrounded unless a foreground service is active
 * (e.g. via the background location task). On iOS the subscription persists
 * as long as the app is not terminated.
 */
export function useCrashDetection() {
  const lastNotifiedAt = useRef<number>(0);

  useEffect(() => {
    setupCrashNotificationChannel();

    if (Platform.OS === "android" && nativeCrashDetection) {
      nativeCrashDetection.start(
        CRASH_DETECTION_THRESHOLD,
        CRASH_NOTIFICATION_COOLDOWN_MS,
      );

      return () => {
        nativeCrashDetection.stop();
      };
    }

    Accelerometer.setUpdateInterval(100); // 10 samples per second

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      if (magnitude >= CRASH_DETECTION_THRESHOLD) {
        const now = Date.now();
        if (now - lastNotifiedAt.current < CRASH_NOTIFICATION_COOLDOWN_MS) {
          return; // still in cooldown — skip
        }
        lastNotifiedAt.current = now;
        fireCrashNotification(magnitude);
      }
    });

    return () => subscription.remove();
  }, []);
}

async function fireCrashNotification(magnitude: number): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Possible crash detected",
        body: "A sudden impact was detected on your device. Are you okay?",
        data: { type: "crash_detection", magnitude },
        sound: "default",
        ...(Platform.OS === "android" && {
          channelId: CRASH_DETECTION_CHANNEL_ID,
        }),
      },
      trigger: null, // fire immediately
    });
  } catch (err) {
    console.warn("Failed to schedule crash notification:", err);
  }
}
