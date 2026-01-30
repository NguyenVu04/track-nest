import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";

export default function useDeviceHeading(enabled: boolean) {
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const headingSubscriberRef = useRef<Location.LocationSubscription | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setHeading(null);
      return;
    }

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Location permission not granted");
          return;
        }

        // Watch heading for real-time compass updates
        headingSubscriberRef.current = await Location.watchHeadingAsync(
          (headingData) => {
            if (cancelled) return;
            setHeading(headingData.trueHeading ?? headingData.magHeading);
          },
        );
      } catch (err: any) {
        setError(err?.message ?? String(err));
      }
    })();

    return () => {
      cancelled = true;
      try {
        headingSubscriberRef.current?.remove?.();
      } catch {
        /* ignore */
      }
    };
  }, [enabled]);

  return { heading, error };
}
