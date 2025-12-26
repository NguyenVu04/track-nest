import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { MapType } from "react-native-maps";

type Props = {
  tracking: boolean;
  setTracking: (v: boolean) => void;
  onSearchPress?: () => void;
  maptype?: MapType;
  sharingEnabled?: boolean;
  setSharingEnabled?: (v: boolean) => void;
};

export default function MapHeader({
  tracking,
  setTracking,
  onSearchPress,
  maptype = "standard",
  sharingEnabled,
  setSharingEnabled,
}: Props) {
  const onToggleShare = (v: boolean) => setSharingEnabled?.(v);

  return (
    <View style={styles.header}>
      <Pressable
        style={styles.iconButton}
        onPress={() => {
          onSearchPress?.();
        }}
      >
        <Ionicons name="search" size={22} color="#ccc" />
      </Pressable>

      <View style={styles.headerRight}>
        <View style={styles.switchRow}>
          <Text style={[styles.trackLabel, { color: "#ccc" }]}>Tracking</Text>
          <Switch value={tracking} onValueChange={setTracking} />
        </View>

        <View style={styles.switchRow}>
          <Text style={[styles.trackLabel, { color: "#ccc" }]}>Share</Text>
          <Switch value={sharingEnabled} onValueChange={onToggleShare} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 36,
    left: 12,
    right: 12,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 8,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    // elevation: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 0,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  trackLabel: { marginRight: 0 },
});
