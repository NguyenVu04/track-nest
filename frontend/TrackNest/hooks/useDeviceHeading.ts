import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";

export default function useDeviceHeading(enabled: boolean) {
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const headingSubscriberRef = useRef<Location.LocationSubscription | null>(
    null,
  );
  const lastHeadingRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setHeading(null);
      lastHeadingRef.current = null;
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
            const newHeading =
              headingData.trueHeading ?? headingData.magHeading;
            const prev = lastHeadingRef.current;
            // Only update state if heading changed by at least 10 degrees
            // to avoid excessive re-renders and marker blinking
            if (prev === null || Math.abs(newHeading - prev) >= 10) {
              lastHeadingRef.current = newHeading;
              setHeading(newHeading);
            }
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
