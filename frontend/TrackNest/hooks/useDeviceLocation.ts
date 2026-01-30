import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";

const LOCATION_STORAGE_KEY = "@tracknest/last_location";

type LocationState = {
  latitude: number;
  longitude: number;
  speed: number | null;
};

// Load saved location from storage
const loadSavedLocation = async (): Promise<LocationState | null> => {
  try {
    const saved = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    /* ignore */
  }
  return null;
};

// Save location to storage
const saveLocation = async (location: LocationState): Promise<void> => {
  try {
    await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
  } catch {
    /* ignore */
  }
};

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

    (async () => {
      try {
        // First, load saved location for instant display
        const saved = await loadSavedLocation();
        if (cancelled) return;

        if (saved && !locationRef.current) {
          locationRef.current = saved;
          setLocation(saved);
        }

        // Then request permission and get fresh GPS position
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Location permission not granted");
          return;
        }

        const last = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        if (cancelled) return;

        const newLocation: LocationState = {
          latitude: last.coords.latitude,
          longitude: last.coords.longitude,
          speed: last.coords.speed,
        };

        // Only update if location is significantly different
        if (isLocationDifferent(locationRef.current, newLocation)) {
          locationRef.current = newLocation;
          setLocation(newLocation);
          saveLocation(newLocation);
        }

        // subscribe only if tracking is enabled
        if (tracking) {
          // Watch position for lat/lng and speed
          positionSubscriberRef.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.BestForNavigation,
              timeInterval: 3000,
              distanceInterval: 100,
            },
            (loc) => {
              if (cancelled) return;
              const updatedLocation: LocationState = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                speed: loc.coords.speed,
              };
              // Only update if location is significantly different
              if (isLocationDifferent(locationRef.current, updatedLocation)) {
                locationRef.current = updatedLocation;
                setLocation(updatedLocation);
                saveLocation(updatedLocation);
              }
            },
          );
        }
      } catch (err: any) {
        setError(err?.message ?? String(err));
      }
    })();

    return () => {
      cancelled = true;
      try {
        positionSubscriberRef.current?.remove?.();
      } catch {
        /* ignore */
      }
    };
  }, [tracking]);

  return { location, error };
}
