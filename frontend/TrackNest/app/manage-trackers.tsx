import { getInitials } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const mockTrackers = [
  {
    id: "tk-101",
    name: "John Cena",
    status: "online" as const,
    lastPing: "2m ago",
  },
  {
    id: "tk-245",
    name: "Superman",
    status: "offline" as const,
    lastPing: "18m ago",
  },
  {
    id: "tk-330",
    name: "Batman",
    status: "online" as const,
    lastPing: "5m ago",
  },
];

type Tracker = (typeof mockTrackers)[number];

export default function ManageTrackersScreen() {
  const router = useRouter();

  const renderItem = ({ item }: { item: Tracker }) => {
    const isOnline = item.status === "online";

    return (
      <Pressable style={styles.card} android_ripple={{ color: "#e5e7eb" }}>
        <View style={styles.iconWrap}>
          <View
            style={[
              styles.initialsBg,
              { backgroundColor: isOnline ? "#2b9fff" : "#999" },
            ]}
          >
            <Text style={styles.initials}>{getInitials(item.name)}</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.trackerName}>{item.name}</Text>
            <View
              style={[
                styles.badge,
                isOnline ? styles.badgeOnline : styles.badgeOffline,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: isOnline ? "#166534" : "#991b1b" },
                ]}
              >
                {isOnline ? "Online" : "Offline"}
              </Text>
            </View>
          </View>
          <View style={[styles.rowBetween, { marginTop: 6 }]}>
            <View style={styles.metaRow}>
              <Ionicons name="time" size={14} color="#6b7280" />
              <Text style={styles.metaText}>Last ping {item.lastPing}</Text>
            </View>
          </View>
        </View>
        <Pressable
          onPress={() => {
            Alert.alert("Delete this trackers?");
          }}
        >
          <Ionicons name="trash" size={18} color="#9ca3af" />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.push("/(tabs)/settings")}
          style={styles.headerAction}
        >
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Manage Trackers</Text>
        <View style={styles.headerAction} />
      </View>

      <FlatList
        data={mockTrackers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListFooterComponent={
          <Pressable
            style={styles.addButton}
            android_ripple={{ color: "#dbeafe" }}
          >
            <Ionicons name="add-circle" size={18} color="#0b62ff" />
            <Text style={styles.addButtonText}>Add new tracker</Text>
          </Pressable>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerRow: {
    height: 72,
    paddingTop: 24,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  headerAction: { width: 32, alignItems: "center" },
  card: {
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  trackerName: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  subtle: { color: "#4b5563", marginTop: 2 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  metaText: { color: "#6b7280", fontSize: 12 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeOnline: { backgroundColor: "#ecfdf3", borderColor: "#bbf7d0" },
  badgeOffline: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  badgeText: { fontSize: 12, fontWeight: "600" },
  addButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addButtonText: { color: "#0b62ff", fontWeight: "700" },
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
