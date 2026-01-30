import { MapHeader as mapHeaderLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { FamilyCircleSelector } from "./FamilyCircleSelector";
import { FamilyCircle } from "@/constant/types";

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "alert" | "info" | "warning";
  read: boolean;
};

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Tracker Alert",
    message: "Car Tracker went offline 15 minutes ago",
    time: "15m ago",
    type: "alert",
    read: false,
  },
  {
    id: "2",
    title: "Location Update",
    message: "Bike Tracker location updated successfully",
    time: "1h ago",
    type: "info",
    read: false,
  },
  {
    id: "3",
    title: "Battery Warning",
    message: "Backpack Tracker battery below 20%",
    time: "2h ago",
    type: "warning",
    read: true,
  },
  {
    id: "4",
    title: "New Follower",
    message: "John Doe started following your location",
    time: "3h ago",
    type: "info",
    read: true,
  },
  {
    id: "5",
    title: "System Update",
    message: "TrackNest app updated to version 1.0.1",
    time: "1d ago",
    type: "info",
    read: true,
  },
  {
    id: "6",
    title: "Location Update",
    message: "Bike Tracker location updated successfully",
    time: "1h ago",
    type: "info",
    read: false,
  },
  {
    id: "7",
    title: "Battery Warning",
    message: "Backpack Tracker battery below 20%",
    time: "2h ago",
    type: "warning",
    read: true,
  },
  {
    id: "8",
    title: "New Follower",
    message: "John Doe started following your location",
    time: "3h ago",
    type: "info",
    read: true,
  },
  {
    id: "9",
    title: "System Update",
    message: "TrackNest app updated to version 1.0.1",
    time: "1d ago",
    type: "info",
    read: true,
  },
];

type Props = {
  tracking: boolean;
  setTracking: (v: boolean) => void;
  onSearchPress?: () => void;
  selectedCircle: FamilyCircle | null;
  handleFamilyCircleModalPress: () => void;
};

export default function MapHeader({
  tracking,
  setTracking,
  onSearchPress,
  selectedCircle,
  handleFamilyCircleModalPress,
}: Props) {
  const t = useTranslation(mapHeaderLang);
  const [notificationsVisible, setNotificationsVisible] = useState(false);

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "alert":
        return "alert-circle";
      case "warning":
        return "warning";
      case "info":
        return "information-circle";
    }
  };

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "alert":
        return "#e74c3c";
      case "warning":
        return "#f39c12";
      case "info":
        return "#74becb";
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <Pressable
      style={[styles.notificationItem, !item.read && styles.notificationUnread]}
      android_ripple={{ color: "#e5e7eb" }}
    >
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
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>
        <Text style={styles.notificationMessage}>{item.message}</Text>
      </View>
    </Pressable>
  );

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            style={styles.iconButton}
            onPress={() => {
              onSearchPress?.();
            }}
          >
            <Ionicons name="search" size={22} color="#757575" />
          </Pressable>

          <Pressable
            style={styles.iconButton}
            onPress={() => setNotificationsVisible(true)}
          >
            <Ionicons name="notifications" size={22} color="#757575" />
            {mockNotifications.some((n) => !n.read) && (
              <View style={styles.badge} />
            )}
          </Pressable>
        </View>

        <View style={styles.headerMid}>
          <FamilyCircleSelector
            selectedCircle={selectedCircle}
            onPress={handleFamilyCircleModalPress}
          />
        </View>

        <View style={styles.headerRight}>
          <View style={styles.switchRow}>
            <Text style={[styles.trackLabel, { color: "#757575" }]}>
              {t.tracking}
            </Text>
            <Switch value={tracking} onValueChange={setTracking} />
          </View>
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
              <Pressable
                style={styles.closeButton}
                onPress={() => setNotificationsVisible(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </Pressable>
            </View>

            <FlatList
              data={mockNotifications}
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 8,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    gap: 8,
    // elevation: 10,
  },
  headerLeft: {
    flexDirection: "column",
    gap: 8,
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
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 0,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,1)",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  trackLabel: { marginRight: 0 },
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
});
