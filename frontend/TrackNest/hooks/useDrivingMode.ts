import {
  CRASH_NOTIFICATION_COOLDOWN_MS,
  DRIVING_CRASH_THRESHOLD,
  TRACKING_MODE_CHANGED_EVENT,
  TrackingMode,
} from "@/constant";
import { setupCrashNotificationChannel } from "@/utils/notifications";
import { Accelerometer } from "expo-sensors";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import { NativeEventEmitter, NativeModules, Platform } from "react-native";

type CrashDetectionNativeModule = {
  start: (threshold: number, cooldownMs: number, drivingMode: boolean) => void;
  stop: () => void;
};

const nativeCrashDetection = NativeModules.CrashDetectionModule as
  | CrashDetectionNativeModule
  | undefined;

const nativeLocation = NativeModules.NativeLocationModule;

/**
 * Listens for tracking mode changes from the native location service.
 * - On Android: manages crash detection service lifecycle based on mode.
 * - On iOS: runs crash detection always (no native driving-mode detection).
 *
 * Returns the current tracking mode so consumers can react to driving state.
 */
export function useDrivingMode(): TrackingMode {
  const [mode, setMode] = useState<TrackingMode>("NORMAL");
  const lastCrashAt = useRef<number>(0);

  useEffect(() => {
    setupCrashNotificationChannel();

    if (Platform.OS === "android") {
      const emitter = new NativeEventEmitter(nativeLocation);
      const sub = emitter.addListener(
        TRACKING_MODE_CHANGED_EVENT,
        (newMode: string) => {
          const typed = newMode as TrackingMode;
          setMode(typed);
          if (typed === "NAVIGATION") {
            nativeCrashDetection?.start(
              DRIVING_CRASH_THRESHOLD,
              CRASH_NOTIFICATION_COOLDOWN_MS,
              true,
            );
          } else {
            nativeCrashDetection?.stop();
          }
        },
      );

      return () => {
        sub.remove();
        nativeCrashDetection?.stop();
      };
    }

    // iOS: crash detection runs always via Expo accelerometer
    return startIosCrashDetection(lastCrashAt);
  }, []);

  return mode;
}

function startIosCrashDetection(
  lastCrashAt: React.MutableRefObject<number>,
): () => void {
  Accelerometer.setUpdateInterval(100);

  const subscription = Accelerometer.addListener(({ x, y, z }) => {
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    if (magnitude >= DRIVING_CRASH_THRESHOLD) {
      const now = Date.now();
      if (now - lastCrashAt.current < CRASH_NOTIFICATION_COOLDOWN_MS) return;
      lastCrashAt.current = now;
      scheduleCrashNotification(magnitude, false);
    }
  });

  return () => subscription.remove();
}

async function scheduleCrashNotification(
  magnitude: number,
  isDriving: boolean,
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: isDriving ? "Collision detected while driving!" : "Possible crash detected",
        body: isDriving
          ? `A sudden impact was detected while driving (${magnitude.toFixed(1)}g). Are you okay?`
          : `A sudden impact was detected (${magnitude.toFixed(1)}g). Are you okay?`,
        data: { type: "crash_detection", magnitude },
        sound: "default",
      },
      trigger: null,
    });
  } catch {
    // non-critical
  }
}
