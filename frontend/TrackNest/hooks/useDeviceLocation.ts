import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";

export default function useDeviceLocation(tracking: boolean) {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const subscriberRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Location permission not granted");
          return;
        }

        const last = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        if (cancelled) return;

        setLocation({
          latitude: last.coords.latitude,
          longitude: last.coords.longitude,
        });

        // subscribe only if tracking is enabled
        if (tracking) {
          subscriberRef.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.BestForNavigation,
              timeInterval: 3000,
              distanceInterval: 100,
            },
            (loc) => {
              if (cancelled) return;
              setLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              });
            }
          );
        }
      } catch (err: any) {
        setError(err?.message ?? String(err));
      }
    })();

    return () => {
      cancelled = true;
      try {
        subscriberRef.current?.remove?.();
      } catch {
        /* ignore */
      }
    };
  }, [tracking]);

  return { location, error };
}
