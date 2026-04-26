import { TrackingMode } from "@/constant";
import { useEffect, useRef, useState } from "react";
import { Alert, NativeModules, Platform } from "react-native";

type DistractionCounts = {
  calls: number;
  sms: number;
  messaging: number;
  sessionStartMs: number;
};

type DistractionTrackerNativeModule = {
  isPermissionGranted: () => Promise<boolean>;
  openPermissionSettings: () => void;
  setDrivingMode: (enabled: boolean) => void;
  getDistractionCounts: () => Promise<DistractionCounts>;
};

const module = NativeModules.DistractionTrackerModule as
  | DistractionTrackerNativeModule
  | undefined;

const POLL_INTERVAL_MS = 5_000;

/**
 * Tracks potentially distracting notifications (calls, SMS, messaging apps)
 * received while the user is driving.
 *
 * Requires the user to grant Notification Access in Android system settings.
 * When permission is not granted and driving starts, shows a one-time prompt.
 */
export function useDistractionTracker(mode: TrackingMode) {
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null,
  );
  const [counts, setCounts] = useState<DistractionCounts>({
    calls: 0,
    sms: 0,
    messaging: 0,
    sessionStartMs: 0,
  });

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const permissionPromptShown = useRef(false);
  const isDriving = mode === "NAVIGATION";

  useEffect(() => {
    if (Platform.OS !== "android" || !module) return;
    module.isPermissionGranted().then(setPermissionGranted);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android" || !module) return;

    if (isDriving) {
      if (permissionGranted === false && !permissionPromptShown.current) {
        permissionPromptShown.current = true;
        Alert.alert(
          "Enable Distraction Tracking",
          "Grant notification access so TrackNest can count calls and messages received while you drive.",
          [
            { text: "Not Now", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => module.openPermissionSettings(),
            },
          ],
        );
      }

      if (permissionGranted) {
        module.setDrivingMode(true);
        pollRef.current = setInterval(fetchCounts, POLL_INTERVAL_MS);
      }
    } else {
      if (permissionGranted && pollRef.current !== null) {
        module.setDrivingMode(false);
        clearInterval(pollRef.current);
        pollRef.current = null;

        // Show session summary when driving ends
        module.getDistractionCounts().then((final) => {
          const total = final.calls + final.sms + final.messaging;
          if (total > 0) {
            Alert.alert(
              "Driving Session Summary",
              `During your drive, your phone received:\n\n• ${final.calls} incoming call(s)\n• ${final.sms} SMS / text message(s)\n• ${final.messaging} messaging app notification(s)\n\nThese notifications may have caused distraction while driving.`,
              [{ text: "OK" }],
            );
          }
          setCounts({ calls: 0, sms: 0, messaging: 0, sessionStartMs: 0 });
        });
      }
    }

    return () => {
      if (pollRef.current !== null) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isDriving, permissionGranted]);

  async function fetchCounts() {
    if (!module) return;
    try {
      const data = await module.getDistractionCounts();
      setCounts(data);
    } catch {
      // non-critical polling failure
    }
  }

  return { permissionGranted, counts };
}
