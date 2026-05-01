import { manageTrackers as manageTrackersLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { getInitials } from "@/utils";
import {
  listFamilyCircles,
  listFamilyCircleMembers,
  removeMemberFromFamilyCircle,
} from "@/services/trackingManager";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type CircleOption = { familyCircleId: string; name: string };

type Member = {
  memberId: string;
  memberUsername: string;
  memberAvatarUrl?: string;
  familyRole: string;
  isAdmin: boolean;
  online: boolean;
  lastActiveMs: number;
};

export default function ManageTrackersScreen() {
  const router = useRouter();
  const t = useTranslation(manageTrackersLang);

  const [circles, setCircles] = useState<CircleOption[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<CircleOption | null>(
    null,
  );
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingCircles, setLoadingCircles] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const loadCircles = useCallback(async () => {
    setLoadingCircles(true);
    try {
      const result = await listFamilyCircles(50);
      const circleList = result.familyCirclesList.map((c) => ({
        familyCircleId: c.familyCircleId,
        name: c.name,
      }));
      setCircles(circleList);
      if (circleList.length > 0 && !selectedCircle) {
        setSelectedCircle(circleList[0]);
      }
    } catch (err) {
      console.error("Failed to load circles:", err);
    } finally {
      setLoadingCircles(false);
    }
  }, [selectedCircle]);

  const loadMembers = useCallback(async (circleId: string) => {
    setLoadingMembers(true);
    try {
      const result = await listFamilyCircleMembers(circleId);
      setMembers(result.membersList as Member[]);
    } catch (err) {
      console.error("Failed to load members:", err);
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    loadCircles();
  }, []);

  useEffect(() => {
    if (selectedCircle) {
      loadMembers(selectedCircle.familyCircleId);
    }
  }, [selectedCircle, loadMembers]);

  const handleRemoveMember = (member: Member) => {
    if (!selectedCircle) return;
    Alert.alert(
      t.deleteConfirm,
      t.removeFromCircleMessage
        .replace("{{member}}", member.memberUsername)
        .replace("{{circle}}", selectedCircle.name),
      [
        { text: t.cancelButton, style: "cancel" },
        {
          text: t.removeButton,
          style: "destructive",
          onPress: async () => {
            try {
              await removeMemberFromFamilyCircle(
                selectedCircle.familyCircleId,
                member.memberId,
              );
              setMembers((prev) =>
                prev.filter((m) => m.memberId !== member.memberId),
              );
            } catch (err: any) {
              showToast(err?.message ?? t.removeFailedMessage, t.errorTitle);
            }
          },
        },
      ],
    );
  };

  const renderMember = ({ item }: { item: Member }) => {
    const isOnline = item.online;
    const lastActiveLabel = item.lastActiveMs
      ? new Date(item.lastActiveMs).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

    return (
      <Pressable style={styles.card} android_ripple={{ color: "#e5e7eb" }}>
        <View style={styles.iconWrap}>
          <View
            style={[
              styles.initialsBg,
              { backgroundColor: isOnline ? "#74becb" : "#999" },
            ]}
          >
            <Text style={styles.initials}>
              {getInitials(item.memberUsername)}
            </Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.trackerName}>{item.memberUsername}</Text>
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
                {isOnline ? t.onlineStatus : t.offlineStatus}
              </Text>
            </View>
          </View>
          <View style={[styles.rowBetween, { marginTop: 6 }]}>
            <View style={styles.metaRow}>
              <Ionicons name="people-outline" size={14} color="#6b7280" />
              <Text style={styles.metaText}>
                {item.familyRole}
                {item.isAdmin ? ` ${t.adminSuffix}` : ""}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="time" size={14} color="#6b7280" />
              <Text style={styles.metaText}>
                {t.lastPing} {lastActiveLabel}
              </Text>
            </View>
          </View>
        </View>
        <Pressable onPress={() => handleRemoveMember(item)}>
          <Ionicons name="trash" size={18} color="#9ca3af" />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.push("/settings")}
          style={styles.headerAction}
        >
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>{t.pageTitle}</Text>
        <Pressable
          onPress={loadCircles}
          style={styles.headerAction}
          disabled={loadingCircles}
        >
          {loadingCircles ? (
            <ActivityIndicator size="small" color="#74becb" />
          ) : (
            <Ionicons name="refresh" size={20} color="#111827" />
          )}
        </Pressable>
      </View>

      {/* Circle selector */}
      {circles.length > 1 && (
        <View style={styles.circleSelector}>
          {circles.map((circle) => (
            <Pressable
              key={circle.familyCircleId}
              style={[
                styles.circleChip,
                selectedCircle?.familyCircleId === circle.familyCircleId &&
                  styles.circleChipActive,
              ]}
              onPress={() => setSelectedCircle(circle)}
            >
              <Text
                style={[
                  styles.circleChipText,
                  selectedCircle?.familyCircleId === circle.familyCircleId &&
                    styles.circleChipTextActive,
                ]}
                numberOfLines={1}
              >
                {circle.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {loadingMembers ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#74becb" />
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.memberId}
          renderItem={renderMember}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={{ color: "#6b7280" }}>
                {circles.length === 0
                  ? "No family circles found. Create one to start tracking."
                  : "No members in this circle."}
              </Text>
            </View>
          }
          ListFooterComponent={
            <Pressable
              style={styles.addButton}
              android_ripple={{ color: "#e0f2f5" }}
              onPress={() => router.push("/(app)/family-circles/new")}
            >
              <Ionicons name="add-circle" size={18} color="#74becb" />
              <Text style={styles.addButtonText}>{t.addNewTracker}</Text>
            </Pressable>
          }
        />
      )}
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
  circleSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  circleChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
    maxWidth: 160,
  },
  circleChipActive: { backgroundColor: "#74becb", borderColor: "#74becb" },
  circleChipText: { fontSize: 13, color: "#374151" },
  circleChipTextActive: { color: "#fff", fontWeight: "600" },
  centered: {
    flex: 1,
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
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
  initialsBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { color: "#fff", fontWeight: "600" },
  trackerName: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
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
    borderColor: "#a8d8e0",
    backgroundColor: "#e0f2f5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addButtonText: { color: "#74becb", fontWeight: "700" },
});
