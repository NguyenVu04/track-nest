import { LOCATION_UPDATE_EMIT_EVENT } from "@/constant";
import { scheduleLocationUpdateNotification } from "@/utils/notifications";
import { useEffect } from "react";
import { DeviceEventEmitter } from "react-native";

/**
 * Listens for location updates emitted by the native Android service
 * (NativeLocationModule) and fires a local notification for each one.
 *
 * This hook covers the foreground path. The background-task path
 * (expo background location task) is handled separately in
 * services/backgroundTasks.ts so notifications still fire when the
 * app is suspended or killed.
 */
export function useLocationNotification(): void {
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      LOCATION_UPDATE_EMIT_EVENT,
      (payload: { latitude: number; longitude: number; speed?: number | null }) => {
        scheduleLocationUpdateNotification(
          payload.latitude,
          payload.longitude,
          payload.speed,
        );
      },
    );
    return () => sub.remove();
  }, []);
}
