import { settings as settingsLang } from "@/constant/languages";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";
import { getUserTargets, getUserTrackers } from "@/services/trackingManager";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";

const CREDENTIALS_KEY = "@TrackNest:credentials";

export default function SettingsScreen() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const t = useTranslation(settingsLang);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showTrackersModal, setShowTrackersModal] = useState(false);

  const [targets, setTargets] = useState([]);
  const [trackers, setTrackers] = useState([]);

  const handleLanguageSelect = async (
    selectedLang: "English" | "Vietnamese"
  ) => {
    await setLanguage(selectedLang);
    setShowLanguageModal(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out? Your credentials will be cleared.",
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Sign Out",
          onPress: async () => {
            try {
              // Clear saved credentials
              await AsyncStorage.removeItem(CREDENTIALS_KEY);
              // Navigate to login screen
              router.replace("/login");
            } catch (error) {
              console.error("Error during logout:", error);
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const items = [
    {
      key: "language",
      title: t.languageTitle,
      subtitle:
        language === "English" ? t.languageEnglishSubtitle : t.languageSubtitle,
      icon: "language",
      onPress: () => {
        setShowLanguageModal(true);
      },
    },
    {
      key: "manageTrackers",
      title: t.manageTrackersTitle,
      subtitle: `3 ${t.manageTrackersSubtitle}`,
      icon: "navigate",
      onPress: () => {
        console.log("Manage Trackers Pressed");
        setShowTrackersModal(true);
        getUserTrackers(setTrackers);
      },
    },
    {
      key: "followers",
      title: t.manageFollowersTitle,
      subtitle: `12 ${t.manageFollowersSubtitle}`,
      icon: "people",
      onPress: () => {
        console.log("Manage Followers Pressed");
        setShowFollowersModal(true);
        getUserTargets(setTargets);
      },
    },
    {
      key: "notifications",
      title: t.notificationsTitle,
      subtitle: t.notificationsOn,
      icon: "notifications",
    },
    {
      key: "privacy",
      title: t.privacyTitle,
      subtitle: "",
      icon: "shield-checkmark",
    },
    { key: "help", title: t.helpTitle, subtitle: "", icon: "help-circle" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>{t.pageTitle}</Text>
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
          <Pressable style={styles.signOutRow} onPress={handleLogout}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View style={[styles.iconWrap, { backgroundColor: "#fff5f5" }]}>
                <Ionicons name="log-out" size={20} color="#ff3b30" />
              </View>
              <Text style={[styles.rowTitle, { color: "#ff3b30" }]}>
                {t.signOutButton}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </Pressable>
        </View>

        <Modal
          visible={showLanguageModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLanguageModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowLanguageModal(false)}
          >
            <View
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t.languageTitle}</Text>
                <Pressable
                  onPress={() => setShowLanguageModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </Pressable>
              </View>

              <Pressable
                style={[
                  styles.languageOption,
                  language === "English" && styles.languageOptionSelected,
                ]}
                onPress={() => handleLanguageSelect("English")}
                android_ripple={{ color: "#e5e7eb" }}
              >
                <View style={styles.languageOptionContent}>
                  <View>
                    <Text style={styles.languageOptionTitle}>English</Text>
                    <Text style={styles.languageOptionSubtitle}>English</Text>
                  </View>
                  {language === "English" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#0b62ff"
                    />
                  )}
                </View>
              </Pressable>

              <Pressable
                style={[
                  styles.languageOption,
                  language === "Vietnamese" && styles.languageOptionSelected,
                ]}
                onPress={() => handleLanguageSelect("Vietnamese")}
                android_ripple={{ color: "#e5e7eb" }}
              >
                <View style={styles.languageOptionContent}>
                  <View>
                    <Text style={styles.languageOptionTitle}>Tiếng Việt</Text>
                    <Text style={styles.languageOptionSubtitle}>
                      Vietnamese
                    </Text>
                  </View>
                  {language === "Vietnamese" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#0b62ff"
                    />
                  )}
                </View>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        <Modal
          visible={showFollowersModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFollowersModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowFollowersModal(false)}
          >
            {targets.length === 0 ? (
              <Text>Loading...</Text>
            ) : (
              <View
                style={styles.modalContent}
                onStartShouldSetResponder={() => true}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {t.manageFollowersTitle}
                  </Text>
                  <Pressable
                    onPress={() => setShowFollowersModal(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </Pressable>
                </View>

                {targets.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyStateText}>No followers yet</Text>
                  </View>
                ) : (
                  <View style={styles.followersList}>
                    {targets.map((target: any, index: number) => (
                      <View key={index} style={styles.followerItem}>
                        <View style={styles.followerAvatar}>
                          <Ionicons name="person" size={24} color="#3b82f6" />
                        </View>
                        <View style={styles.followerInfo}>
                          <Text style={styles.followerName}>
                            {target.username || "Unknown User"}
                          </Text>
                          <Text style={styles.followerDetail}>
                            ID: {target.userid || "N/A"}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </Pressable>
        </Modal>

        <Modal
          visible={showTrackersModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowTrackersModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowTrackersModal(false)}
          >
            {trackers.length === 0 ? (
              <Text>Loading...</Text>
            ) : (
              <View
                style={styles.modalContent}
                onStartShouldSetResponder={() => true}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t.manageTrackersTitle}</Text>
                  <Pressable
                    onPress={() => setShowTrackersModal(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </Pressable>
                </View>

                {trackers.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="navigate-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyStateText}>No trackers yet</Text>
                  </View>
                ) : (
                  <View style={styles.followersList}>
                    {trackers.map((tracker: any, index: number) => (
                      <View key={index} style={styles.followerItem}>
                        <View style={styles.followerAvatar}>
                          <Ionicons name="navigate" size={24} color="#3b82f6" />
                        </View>
                        <View style={styles.followerInfo}>
                          <Text style={styles.followerName}>
                            {tracker.username || "Unknown Tracker"}
                          </Text>
                          <Text style={styles.followerDetail}>
                            ID: {tracker.userid || "N/A"}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </Pressable>
        </Modal>
        <View style={{ alignItems: "center", marginTop: 40 }}>
          <Text style={{ color: "#999" }}>{t.appName}</Text>
          <Text style={{ color: "#999", marginTop: 4 }}>
            {t.versionLabel} 1.0.0
            {/* Language Selection Modal */}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  closeButton: {
    // padding: 4,
  },
  languageOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  languageOptionSelected: {
    backgroundColor: "#f0f7ff",
  },
  languageOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  languageOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 2,
  },
  languageOptionSubtitle: {
    fontSize: 13,
    color: "#666",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: "#999",
  },
  followersList: {
    maxHeight: 400,
  },
  followerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  followerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  followerInfo: {
    flex: 1,
  },
  followerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 2,
  },
  followerDetail: {
    fontSize: 13,
    color: "#666",
  },
});
