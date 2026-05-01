import type { ClientReadableStream } from "grpc-web";
import { useEffect, useRef, useState } from "react";

import { Follower } from "@/constant/types";
import { FamilyMemberLocation } from "@/proto/tracker_pb";
import { streamFamilyMemberLocations } from "@/services/tracker";

// ~3m — below this the client-side smooth animation handles jitter, no need to
// re-render the whole list of markers.
const MIN_POSITION_DELTA = 0.00003;

/**
 * Streams live family-member locations for the given circle.
 *
 * Returns an array of `Follower` objects that is kept up-to-date as the
 * server pushes new positions. The stream is automatically started /
 * restarted when `familyCircleId` or `enabled` changes and is cancelled
 * on cleanup.
 */
export function useStreamedFollowers(
  familyCircleId: string | undefined,
  enabled: boolean,
) {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamRef = useRef<ClientReadableStream<FamilyMemberLocation> | null>(
    null,
  );
  // Map keyed by memberId so we always keep the latest position per member
  const membersRef = useRef<Map<string, Follower>>(new Map());
  // Track previous circle so we can detect when it actually changes
  const prevCircleIdRef = useRef<string | undefined>(undefined);
  // Coalesce bursts of updates into one setState per animation frame
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const circleChanged = familyCircleId !== prevCircleIdRef.current;
    prevCircleIdRef.current = familyCircleId;

    // Always cancel any running stream first
    streamRef.current?.cancel();
    streamRef.current = null;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (!familyCircleId) {
      // No circle selected — clear everything
      membersRef.current.clear();
      setFollowers([]);
      setIsStreaming(false);
      return;
    }

    if (!enabled) {
      setIsStreaming(false);
      if (circleChanged) {
        // Circle was swapped while tracking is off — discard stale data
        membersRef.current.clear();
        setFollowers([]);
      }
      // Tracking turned off for the same circle — preserve last known positions
      return;
    }

    // enabled=true: start a fresh stream
    let cancelled = false;
    membersRef.current.clear();
    setFollowers([]);

    const scheduleFlush = () => {
      if (cancelled) return;
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        if (cancelled) return;
        setFollowers(Array.from(membersRef.current.values()));
      });
    };

    const start = async () => {
      try {
        setIsStreaming(true);
        setError(null);

        const stream = await streamFamilyMemberLocations(
          familyCircleId,
          (loc) => {
            if (cancelled) return;

            const next: Follower = {
              id: loc.memberId,
              latitude: loc.latitudeDeg,
              longitude: loc.longitudeDeg,
              familyCircleId,
              name: loc.memberUsername,
              avatar: loc.memberAvatarUrl || undefined,
              lastActive: loc.lastActiveMs || loc.timestampMs,
              sharingActive: loc.online,
              shareTracking: loc.online,
            };

            const existing = membersRef.current.get(loc.memberId);
            membersRef.current.set(loc.memberId, next);

            // Skip state update when nothing meaningful changed: saves a full
            // map re-render + sort when stream pushes redundant heartbeats.
            if (existing) {
              const latDiff = Math.abs(existing.latitude - next.latitude);
              const lngDiff = Math.abs(existing.longitude - next.longitude);
              const metaChanged =
                existing.sharingActive !== next.sharingActive ||
                existing.name !== next.name ||
                existing.avatar !== next.avatar;
              if (
                latDiff < MIN_POSITION_DELTA &&
                lngDiff < MIN_POSITION_DELTA &&
                !metaChanged
              ) {
                return;
              }
            }

            scheduleFlush();
          },
          (err) => {
            if (!cancelled) {
              console.error("Stream error:", err.message);
              setError(err.message);
              setIsStreaming(false);
            }
          },
          () => {
            if (!cancelled) {
              setIsStreaming(false);
            }
          },
        );

        if (!cancelled) {
          streamRef.current = stream;
        } else {
          stream.cancel();
        }
      } catch (err: any) {
        if (!cancelled) {
          // console.error("Failed to start stream:", err.message);
          setError(err.message);
          setIsStreaming(false);
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      streamRef.current?.cancel();
      streamRef.current = null;
    };
  }, [familyCircleId, enabled]);

  return { followers, isStreaming, error };
}
