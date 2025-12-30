import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";

type Props = {
  latitude: number;
  longitude: number;
  avatar?: string;
  name: string;
  sharingActive?: boolean; // true = actively sharing location
  lastActive?: string | number | Date;
};

function formatRelativeTime(lastActive?: string | number | Date) {
  if (!lastActive) return "";
  const d = new Date(lastActive);
  if (isNaN(d.getTime())) return String(lastActive);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 10) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function FollowerMarker({
  latitude,
  longitude,
  avatar,
  name,
  sharingActive = false,
  lastActive,
}: Props) {
  const borderColor = sharingActive ? "#2b9fff" : "#bdbdbd";

  const avatarContent = avatar ? (
    <Image source={{ uri: avatar }} style={styles.avatar} />
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

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      tracksViewChanges={false}
      style={{ position: "relative" }}
    >
      <View style={styles.container}>
        <View style={[styles.avatarWrapper, { borderColor }]}>
          {avatarContent}
        </View>
        {/* <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
          {name}
        </Text> */}
        {!sharingActive && lastActive ? (
          <Text style={styles.lastActive}>
            {formatRelativeTime(lastActive)}
          </Text>
        ) : null}
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
    borderWidth: 3,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
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
  name: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    zIndex: 10,
    fontSize: 12,
    color: "#fff",
    maxWidth: 88,
    textAlign: "center",
  },
  lastActive: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    marginTop: 2,
    fontSize: 11,
    color: "#fff",
    textAlign: "center",
  },
});
