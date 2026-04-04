import { MapHeader as mapHeaderLang } from "@/constant/languages";
import { FamilyCircle } from "@/constant/types";
import { usePOIAnalytics } from "@/contexts/POIAnalyticsContext";
import { AppNotification, useNotifications } from "@/hooks/useNotifications";
import { useTranslation } from "@/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FamilyCircleSelector } from "./FamilyCircleSelector";

function formatTimeAgo(ms: number): string {
  const diffMin = Math.floor((Date.now() - ms) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

type Props = {
  selectedCircle: FamilyCircle | null;
  handleFamilyCircleModalPress: () => void;
};

export default function MapHeader({
  selectedCircle,
  handleFamilyCircleModalPress,
}: Props) {
  const t = useTranslation(mapHeaderLang);
  const { riskLevel, crimeCount, isHighRiskZone } = usePOIAnalytics();
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [notificationTab, setNotificationTab] = useState<"tracking" | "risk">(
    "tracking",
  );
  const {
    trackingNotifications,
    riskNotifications,
    totalCount,
    loading,
    fetchAll,
    clearAll,
    clearTrackingTab,
    clearRiskTab,
    deleteTracking,
    deleteRisk,
  } = useNotifications();

  const handleOpenNotifications = () => {
    fetchAll();
    setNotificationsVisible(true);
  };

  const getNotificationIcon = (type: AppNotification["type"]) =>
    type === "risk" ? "alert-circle" : "information-circle";

  const getNotificationColor = (type: AppNotification["type"]) =>
    type === "risk" ? "#e74c3c" : "#74becb";

  const renderNotification = ({ item }: { item: AppNotification }) => (
    <View style={styles.notificationItem}>
      <View
        style={[
          styles.notificationIcon,
          { backgroundColor: getNotificationColor(item.type) + "20" },
        ]}
      >
        <Ionicons
          name={getNotificationIcon(item.type) as any}
          size={20}
          color={getNotificationColor(item.type)}
        />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.notificationTime}>
            {formatTimeAgo(item.createdAtMs)}
          </Text>
        </View>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.content}
        </Text>
      </View>
      <Pressable
        onPress={() =>
          item.type === "tracking"
            ? deleteTracking(item.id)
            : deleteRisk(item.id)
        }
        hitSlop={8}
        style={{ padding: 4 }}
      >
        <Ionicons name="close" size={16} color="#9ca3af" />
      </Pressable>
    </View>
  );

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FamilyCircleSelector
            selectedCircle={selectedCircle}
            onPress={handleFamilyCircleModalPress}
          />
        </View>

        <View style={styles.headerRight}>
          {/* Risk Level Indicator */}
          {riskLevel !== "low" && (
            <View style={[
              styles.riskBadge,
              riskLevel === "high" ? styles.riskBadgeHigh : styles.riskBadgeMedium
            ]}>
              <Ionicons 
                name={riskLevel === "high" ? "warning" : "alert-circle-outline"} 
                size={14} 
                color="#fff" 
              />
              <Text style={styles.riskText}>
                {riskLevel === "high" ? "High Risk" : "Medium Risk"}
              </Text>
            </View>
          )}
          <Pressable
            style={styles.iconButton}
            onPress={handleOpenNotifications}
          >
            <Ionicons name="notifications" size={22} color="#757575" />
            {totalCount > 0 && <View style={styles.badge} />}
          </Pressable>
        </View>
      </View>

      <Modal
        visible={notificationsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificationsVisible(false)}
        statusBarTranslucent
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setNotificationsVisible(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.notifications}</Text>
              <View
                style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
              >
                <Pressable onPress={clearAll} hitSlop={8}>
                  <Text style={{ color: "#74becb", fontSize: 13 }}>
                    Clear All
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.closeButton}
                  onPress={() => setNotificationsVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </Pressable>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
              <Pressable
                style={[
                  styles.tabBtn,
                  notificationTab === "tracking" && styles.tabBtnActive,
                ]}
                onPress={() => setNotificationTab("tracking")}
              >
                <Text
                  style={[
                    styles.tabText,
                    notificationTab === "tracking" && styles.tabTextActive,
                  ]}
                >
                  Tracking
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.tabBtn,
                  notificationTab === "risk" && styles.tabBtnActive,
                ]}
                onPress={() => setNotificationTab("risk")}
              >
                <Text
                  style={[
                    styles.tabText,
                    notificationTab === "risk" && styles.tabTextActive,
                  ]}
                >
                  Risk
                </Text>
              </Pressable>
              {notificationTab === "tracking" &&
                trackingNotifications.length > 0 && (
                  <Pressable
                    hitSlop={8}
                    onPress={() =>
                      clearTrackingTab(trackingNotifications.map((n) => n.id))
                    }
                    style={{ marginLeft: "auto" }}
                  >
                    <Text style={{ color: "#f39c12", fontSize: 12 }}>
                      Clear tab
                    </Text>
                  </Pressable>
                )}
              {notificationTab === "risk" && riskNotifications.length > 0 && (
                <Pressable
                  hitSlop={8}
                  onPress={() =>
                    clearRiskTab(riskNotifications.map((n) => n.id))
                  }
                  style={{ marginLeft: "auto" }}
                >
                  <Text style={{ color: "#f39c12", fontSize: 12 }}>
                    Clear tab
                  </Text>
                </Pressable>
              )}
            </View>

            {loading ? (
              <ActivityIndicator style={{ padding: 24 }} color="#74becb" />
            ) : (
              <FlatList
                data={
                  notificationTab === "tracking"
                    ? trackingNotifications
                    : riskNotifications
                }
                keyExtractor={(item) => item.id}
                renderItem={renderNotification}
                contentContainerStyle={{ paddingBottom: 16 }}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="notifications-off"
                      size={48}
                      color="#d1d5db"
                    />
                    <Text style={styles.emptyText}>{t.noNotifications}</Text>
                  </View>
                }
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 8,
  },
  headerLeft: {
    flex: 1,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,1)",
    marginLeft: 8,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#e74c3c",
    borderWidth: 2,
    borderColor: "#fff",
  },
  headerMid: {
    flex: 1,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    maxHeight: "50%",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  closeButton: {
    padding: 4,
  },
  notificationItem: {
    flex: 1,
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    alignItems: "center",
  },
  notificationUnread: {
    backgroundColor: "#eff6ff",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  notificationTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  notificationMessage: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9ca3af",
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 8,
    alignItems: "center",
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#f2f2f2",
  },
  tabBtnActive: {
    backgroundColor: "#e0f2f5",
  },
  tabText: { color: "#666", fontSize: 13 },
  tabTextActive: { color: "#74becb", fontWeight: "600", fontSize: 13 },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  riskBadgeHigh: {
    backgroundColor: "#e74c3c",
  },
  riskBadgeMedium: {
    backgroundColor: "#f39c12",
  },
  riskText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
});
