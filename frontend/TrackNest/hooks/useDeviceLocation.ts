import { LOCATION_STORAGE_KEY, LOCATION_UPDATE_EMIT_EVENT } from "@/constant";
import { LocationState } from "@/constant/types";
import {
  loadSavedKey,
  requestPermissionsAndStart,
  stopBackgroundLocationTracking,
} from "@/utils";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { DeviceEventEmitter } from "react-native";

// Check if two locations are significantly different (more than ~10 meters)
const isLocationDifferent = (
  a: LocationState | null,
  b: LocationState,
): boolean => {
  if (!a) return true;
  const latDiff = Math.abs(a.latitude - b.latitude);
  const lngDiff = Math.abs(a.longitude - b.longitude);
  // ~0.0001 degrees ≈ 11 meters
  return latDiff > 0.0001 || lngDiff > 0.0001;
};

export default function useDeviceLocation(tracking: boolean) {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const positionSubscriberRef = useRef<Location.LocationSubscription | null>(
    null,
  );
  const locationRef = useRef<LocationState | null>(null);

  // Single effect for both loading saved location and getting fresh GPS
  useEffect(() => {
    let cancelled = false;
    let pollInterval = null;
    const subscriber = positionSubscriberRef.current;

    const loadAndSetLocation = async () => {
      try {
        const saved = await loadSavedKey<LocationState>(
          LOCATION_STORAGE_KEY,
        ).catch(() => null);
        if (cancelled) return;
        if (
          saved &&
          (!locationRef.current ||
            isLocationDifferent(locationRef.current, saved))
        ) {
          locationRef.current = saved;
          setLocation(saved);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? String(err));
      }
    };

    // Initial load
    loadAndSetLocation();

    if (tracking) {
      requestPermissionsAndStart().catch((err) => {
        if (!cancelled) setError(err?.message ?? String(err));
      });
      // Poll for location updates every 3 seconds
      pollInterval = setInterval(loadAndSetLocation, 3000);
    } else {
      stopBackgroundLocationTracking().catch(() => {});
    }

    return () => {
      cancelled = true;
      if (pollInterval) clearInterval(pollInterval);
      try {
        subscriber?.remove?.();
      } catch {
        /* ignore */
      }
    };
  }, [tracking]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      LOCATION_UPDATE_EMIT_EVENT,
      (newLocation) => {
        locationRef.current = newLocation;
        setLocation(newLocation);
      },
    );
    return () => {
      subscription.remove();
    };
  }, [tracking]);

  return { location, error };
}
