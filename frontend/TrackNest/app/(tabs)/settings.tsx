import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function SettingsScreen() {
  const router = useRouter();

  const items = [
    {
      key: "language",
      title: "Language",
      subtitle: "English",
      icon: "language",
    },
    {
      key: "manageTrackers",
      title: "Manage Trackers",
      subtitle: "3 active trackers",
      icon: "navigate",
      onPress: () => router.push("/manage-trackers"),
    },
    {
      key: "followers",
      title: "Manage Followers",
      subtitle: "12 followers",
      icon: "people",
    },
    {
      key: "notifications",
      title: "Notifications",
      subtitle: "On",
      icon: "notifications",
    },
    {
      key: "privacy",
      title: "Privacy & Security",
      subtitle: "",
      icon: "shield-checkmark",
    },
    { key: "help", title: "Help & Support", subtitle: "", icon: "help-circle" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ padding: 12 }}>
        {items.map((it) => (
          <Pressable
            key={it.key}
            style={styles.row}
            onPress={it.onPress}
            android_ripple={{ color: "#e5e7eb" }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={it.icon as any} size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.rowTitle}>{it.title}</Text>
                {it.subtitle ? (
                  <Text style={styles.rowSubtitle}>{it.subtitle}</Text>
                ) : null}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </Pressable>
        ))}

        <View style={{ marginTop: 28 }}>
          <Pressable style={styles.signOutRow}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View style={[styles.iconWrap, { backgroundColor: "#fff5f5" }]}>
                <Ionicons name="log-out" size={20} color="#ff3b30" />
              </View>
              <Text style={[styles.rowTitle, { color: "#ff3b30" }]}>
                Sign Out
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </Pressable>
        </View>

        <View style={{ alignItems: "center", marginTop: 40 }}>
          <Text style={{ color: "#999" }}>Safety Tracker App</Text>
          <Text style={{ color: "#999", marginTop: 4 }}>Version 1.0.0</Text>
          <Text style={{ color: "#999", marginTop: 4 }}>
            Optimized for mobile web
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerRow: {
    height: 72,
    paddingTop: 24,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  row: {
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontWeight: "600" },
  rowSubtitle: { color: "#666", fontSize: 12 },
  signOutRow: {
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
