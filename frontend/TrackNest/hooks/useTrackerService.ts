import { LocationResponse } from "@/proto/gen/tracker_pb";
import { trackerService } from "@/services/trackerService";
import { useEffect, useRef, useState } from "react";

/**
 * Hook to stream location updates to the server
 */
export function useLocationStream(enabled: boolean) {
  const streamRef = useRef<ReturnType<
    typeof trackerService.startLocationStream
  > | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (enabled && !streamRef.current) {
      // Start the stream
      const stream = trackerService.startLocationStream((code, message) => {
        setIsStreaming(false);
        if (code !== 0) {
          setError(message || "Stream ended with error");
        }
      });
      streamRef.current = stream;
      setIsStreaming(true);
      setError(null);
    } else if (!enabled && streamRef.current) {
      // End the stream
      trackerService.endLocationStream(streamRef.current);
      streamRef.current = null;
      setIsStreaming(false);
    }

    return () => {
      if (streamRef.current) {
        trackerService.endLocationStream(streamRef.current);
        streamRef.current = null;
        setIsStreaming(false);
      }
    };
  }, [enabled]);

  const sendLocation = (
    latitude: number,
    longitude: number,
    accuracy?: number,
    velocity?: number
  ) => {
    if (streamRef.current && isStreaming) {
      trackerService.sendLocation(
        streamRef.current,
        latitude,
        longitude,
        accuracy,
        velocity
      );
    }
  };

  return { isStreaming, error, sendLocation };
}

/**
 * Hook to receive real-time location updates for all targets
 */
export function useTargetLocations(enabled: boolean) {
  const [locations, setLocations] = useState<
    Map<string, LocationResponse.AsObject>
  >(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<ReturnType<
    typeof trackerService.getTargetsLastLocations
  > | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (streamRef.current) {
        streamRef.current.cancel();
        streamRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const stream = trackerService.getTargetsLastLocations(
      (location) => {
        setLocations((prev) => {
          const next = new Map(prev);
          next.set(location.userid, location);
          return next;
        });
      },
      (code, message) => {
        setIsConnected(false);
        if (code !== 0) {
          setError(message || "Stream ended with error");
        }
      },
      (code, message) => {
        setError(message);
      }
    );

    streamRef.current = stream;
    setIsConnected(true);
    setError(null);

    return () => {
      if (streamRef.current) {
        streamRef.current.cancel();
        streamRef.current = null;
      }
      setIsConnected(false);
    };
  }, [enabled]);

  return {
    locations: Array.from(locations.values()),
    isConnected,
    error,
  };
}

/**
 * Hook to get location history for a specific target
 */
export function useTargetHistory(
  targetUserId: string | null,
  center: { latitude: number; longitude: number } | null,
  radius: number = 1000,
  enabled: boolean = true
) {
  const [history, setHistory] = useState<LocationResponse.AsObject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<ReturnType<
    typeof trackerService.getTargetLocationHistory
  > | null>(null);

  useEffect(() => {
    if (!enabled || !targetUserId || !center) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const locations: LocationResponse.AsObject[] = [];

    const stream = trackerService.getTargetLocationHistory(
      targetUserId,
      center.longitude,
      center.latitude,
      radius,
      (location) => {
        locations.push(location);
        setHistory([...locations]);
      },
      (code, message) => {
        setIsLoading(false);
        if (code !== 0) {
          setError(message || "Failed to fetch history");
        }
      },
      (code, message) => {
        setError(message);
        setIsLoading(false);
      }
    );

    streamRef.current = stream;

    return () => {
      if (streamRef.current) {
        streamRef.current.cancel();
        streamRef.current = null;
      }
      setIsLoading(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId, center?.latitude, center?.longitude, radius, enabled]);

  return { history, isLoading, error };
}
