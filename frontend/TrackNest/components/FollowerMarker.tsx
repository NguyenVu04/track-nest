import { getInitials } from "@/utils";
import React, { memo, useEffect, useRef, useState } from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { AnimatedRegion, MapMarker, MarkerAnimated } from "react-native-maps";

type Props = {
  latitude: number;
  longitude: number;
  id: string;
  avatar?: string;
  name: string;
  sharingActive?: boolean; // true = actively sharing location
  lastActive?: string | number | Date;
  setSelectedFollowerId?: (id: string | null) => void;
  handlePresentModalPress?: () => void;
  fetchHistoryForTarget?: (id: string) => void;
};

const MIN_MARKER_MOVEMENT_DELTA = 0.00003; // ~3m — skip meaningless jitter
const ANIMATION_DURATION_MS = 800;

function FollowerMarker({
  latitude,
  longitude,
  id,
  avatar,
  name,
  sharingActive = false,
  setSelectedFollowerId,
  handlePresentModalPress,
  fetchHistoryForTarget,
}: Props) {
  // Only let the native Marker track view changes while the avatar image is loading.
  // Leaving `tracksViewChanges` enabled continuously can cause heavy re-rendering
  // on the native side and lead to crashes when the marker is pressed repeatedly.
  const [tracksViewChanges, setTracksViewChanges] = useState<boolean>(!!avatar);

  const markerRef = useRef<MapMarker>(null);
  const animatedRegionRef = useRef(
    new AnimatedRegion({
      latitude,
      longitude,
      latitudeDelta: 0,
      longitudeDelta: 0,
    }),
  );
  const lastAcceptedCoordRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>({ latitude, longitude });

  useEffect(() => {
    const next = { latitude, longitude };
    const prev = lastAcceptedCoordRef.current;

    if (prev) {
      const latDiff = Math.abs(next.latitude - prev.latitude);
      const lngDiff = Math.abs(next.longitude - prev.longitude);
      if (
        latDiff < MIN_MARKER_MOVEMENT_DELTA &&
        lngDiff < MIN_MARKER_MOVEMENT_DELTA
      ) {
        return;
      }
    }
    lastAcceptedCoordRef.current = next;

    if (
      Platform.OS === "android" &&
      markerRef.current?.animateMarkerToCoordinate
    ) {
      markerRef.current.animateMarkerToCoordinate(next, ANIMATION_DURATION_MS);
    } else {
      animatedRegionRef.current
        .timing({
          ...next,
          latitudeDelta: 0,
          longitudeDelta: 0,
          duration: ANIMATION_DURATION_MS,
          useNativeDriver: false,
          toValue: 0, // unused — AnimatedRegion reads latitude/longitude directly
        })
        .start();
    }
  }, [latitude, longitude]);

  const avatarContent = avatar ? (
    <Image
      source={require("@/assets/images/150-0.jpeg")}
      style={styles.avatar}
      onLoadEnd={() => {
        setTimeout(() => setTracksViewChanges(false), 500);
      }}
      onError={() => setTracksViewChanges(false)}
      resizeMode="cover"
    />
  ) : (
    <View
      style={[
        styles.initialsBg,
        { backgroundColor: sharingActive ? "#74becb" : "#999" },
      ]}
    >
      <Text style={styles.initials}>{getInitials(name)}</Text>
    </View>
  );

  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (id) {
      setTracksViewChanges(true);
    }

    setTimeout(() => setTracksViewChanges(false), 1000);
  }, [id]);

  return (
    <MarkerAnimated
      ref={markerRef}
      coordinate={animatedRegionRef.current}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      onPress={() => {
        if (setSelectedFollowerId) {
          setSelectedFollowerId(id || null);
        }
        if (handlePresentModalPress) {
          handlePresentModalPress();
        }

        if (fetchHistoryForTarget && id) {
          fetchHistoryForTarget(id);
        }
      }}
    >
      <View style={[styles.container]}>
        <View style={styles.avatarWrapper}>
          <View
            style={[
              styles.initialsBg,
              { backgroundColor: sharingActive ? "#74becb" : "#999" },
            ]}
          >
            <Text style={styles.initials}>{getInitials(name)}</Text>
          </View>
        </View>
      </View>
    </MarkerAnimated>
  );
}

function areEqual(prev: Props, next: Props) {
  return (
    prev.id === next.id &&
    prev.latitude === next.latitude &&
    prev.longitude === next.longitude &&
    prev.avatar === next.avatar &&
    prev.name === next.name &&
    prev.sharingActive === next.sharingActive &&
    prev.lastActive === next.lastActive &&
    prev.setSelectedFollowerId === next.setSelectedFollowerId &&
    prev.handlePresentModalPress === next.handlePresentModalPress &&
    prev.fetchHistoryForTarget === next.fetchHistoryForTarget
  );
}

export default memo(FollowerMarker, areEqual);

const styles = StyleSheet.create({
  container: {
    overflow: "visible",
  },
  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  initialsBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: "#fff",
    fontWeight: "600",
  },
});
