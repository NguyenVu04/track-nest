import { LOCATION_STORAGE_KEY, LOCATION_UPDATE_EMIT_EVENT } from "@/constant";
import { LocationState } from "@/constant/types";
import {
  flushNativeLocationBufferToStorage,
  isSamePlace,
  loadSavedKey,
  normalizeLocationState,
  requestPermissionsAndStart,
  stopBackgroundLocationTracking,
} from "@/utils";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { DeviceEventEmitter } from "react-native";

const FALLBACK_REFRESH_MS = 5000;

// Returns true when the two locations differ by more than ~100 metres or when
// speed/accuracy has changed enough to warrant a UI update.
function hasLocationChanged(
  previous: LocationState | null,
  next: LocationState,
): boolean {
  if (!previous) return true;

  const positionChanged = !isSamePlace(
    { latitude: previous.latitude, longitude: previous.longitude },
    { latitude: next.latitude, longitude: next.longitude },
  );

  const speedDelta = Math.abs((previous.speed ?? 0) - (next.speed ?? 0));
  const accuracyDelta = Math.abs((previous.accuracy ?? 0) - (next.accuracy ?? 0));
  const metadataChanged = speedDelta >= 0.5 || accuracyDelta >= 5;

  return positionChanged || metadataChanged;
}

export default function useDeviceLocation(tracking: boolean) {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const locationRef = useRef<LocationState | null>(null);

  const applyLocation = useCallback(
    (next: LocationState | null, force = false) => {
      if (!next) return;
      if (!force && !hasLocationChanged(locationRef.current, next)) return;
      locationRef.current = next;
      setLocation(next);
      setError(null);
    },
    [],
  );

  const refreshFromStorage = useCallback(async () => {
    await flushNativeLocationBufferToStorage();
    const saved = await loadSavedKey<LocationState>(LOCATION_STORAGE_KEY).catch(() => null);
    if (!saved) return;
    applyLocation(normalizeLocationState(saved, locationRef.current));
  }, [applyLocation]);

  // Bootstrap: hydrate from storage, fall back to last-known or current GPS.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await refreshFromStorage();
        if (cancelled || locationRef.current) return;

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (status !== "granted") {
          setError("Location permission not granted");
          return;
        }

        const lastKnown = await Location.getLastKnownPositionAsync();
        if (cancelled) return;

        const source = lastKnown
          ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (cancelled) return;

        applyLocation(
          normalizeLocationState(
            {
              latitude: source.coords.latitude,
              longitude: source.coords.longitude,
              speed: source.coords.speed,
              accuracy: source.coords.accuracy,
              timestamp: source.timestamp,
            },
            locationRef.current,
          ),
        );
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? String(err));
      }
    }

    bootstrap();
    return () => { cancelled = true; };
  }, [refreshFromStorage, applyLocation]);

  // Tracking lifecycle: start/stop the native service and run a fallback poll.
  useEffect(() => {
    let cancelled = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    if (tracking) {
      requestPermissionsAndStart().catch((err) => {
        if (!cancelled) setError(err?.message ?? String(err));
      });

      pollInterval = setInterval(() => {
        refreshFromStorage().catch((err) => {
          if (!cancelled) setError(err?.message ?? String(err));
        });
      }, FALLBACK_REFRESH_MS);
    } else {
      stopBackgroundLocationTracking().catch(() => {});
    }

    return () => {
      cancelled = true;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [tracking, refreshFromStorage]);

  // Primary real-time channel: events emitted by the background task (iOS/Expo
  // path) and by NativeLocationService in navigation mode (Android path).
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      LOCATION_UPDATE_EMIT_EVENT,
      (payload: Partial<LocationState>) => {
        applyLocation(normalizeLocationState(payload, locationRef.current), true);
      },
    );
    return () => sub.remove();
  }, [applyLocation]);

  return { location, error };
}
