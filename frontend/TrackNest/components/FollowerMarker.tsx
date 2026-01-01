import { getInitials } from "@/utils";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";

type Props = {
  latitude: number;
  longitude: number;
  id?: string;
  avatar?: string;
  name: string;
  sharingActive?: boolean; // true = actively sharing location
  lastActive?: string | number | Date;
  selectedFollowerId?: string | null;
  setSelectedFollowerId?: (id: string | null) => void;
  handlePresentModalPress?: () => void;
};

export default function FollowerMarker({
  latitude,
  longitude,
  id,
  avatar,
  name,
  sharingActive = false,
  setSelectedFollowerId,
  handlePresentModalPress,
}: Props) {
  // Only let the native Marker track view changes while the avatar image is loading.
  // Leaving `tracksViewChanges` enabled continuously can cause heavy re-rendering
  // on the native side and lead to crashes when the marker is pressed repeatedly.
  const [tracksViewChanges, setTracksViewChanges] = useState<boolean>(!!avatar);

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
        { backgroundColor: sharingActive ? "#2b9fff" : "#999" },
      ]}
    >
      <Text style={styles.initials}>{getInitials(name)}</Text>
    </View>
  );

  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      onPress={() => {
        if (setSelectedFollowerId) {
          setSelectedFollowerId(id || null);
        }
        if (handlePresentModalPress) {
          handlePresentModalPress();
        }
      }}
    >
      <View style={[styles.container]}>
        <View style={styles.avatarWrapper}>
          <View
            style={[
              styles.initialsBg,
              { backgroundColor: sharingActive ? "#2b9fff" : "#999" },
            ]}
          >
            <Text style={styles.initials}>{getInitials(name)}</Text>
          </View>
        </View>
      </View>
    </Marker>
  );
}

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
