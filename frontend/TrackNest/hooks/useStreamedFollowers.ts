import type { ClientReadableStream } from "grpc-web";
import { useEffect, useRef, useState } from "react";

import { Follower } from "@/constant/types";
import { FamilyMemberLocation } from "@/proto/tracker_pb";
import { streamFamilyMemberLocations } from "@/services/tracker";

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

  useEffect(() => {
    const circleChanged = familyCircleId !== prevCircleIdRef.current;
    prevCircleIdRef.current = familyCircleId;

    // Always cancel any running stream first
    streamRef.current?.cancel();
    streamRef.current = null;

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

    const start = async () => {
      try {
        setIsStreaming(true);
        setError(null);

        const stream = await streamFamilyMemberLocations(
          familyCircleId,
          (loc) => {
            if (cancelled) return;

            const follower: Follower = {
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

            membersRef.current.set(loc.memberId, follower);
            // Snapshot the map into an array for React state
            setFollowers(Array.from(membersRef.current.values()));
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
          console.error("Failed to start stream:", err.message);
          setError(err.message);
          setIsStreaming(false);
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      streamRef.current?.cancel();
      streamRef.current = null;
    };
  }, [familyCircleId, enabled]);

  return { followers, isStreaming, error };
}
