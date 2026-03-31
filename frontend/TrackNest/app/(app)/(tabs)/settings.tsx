import { DeveloperOptionsModal } from "@/components/SettingsModals/DeveloperOptionsModal";
import { LanguageModal } from "@/components/SettingsModals/LanguageModal";
import { LocationPermissionsModal } from "@/components/SettingsModals/LocationPermissionsModal";
import { NotificationPermissionsModal } from "@/components/SettingsModals/NotificationPermissionsModal";
import { PrivacyModal } from "@/components/SettingsModals/PrivacyModal";
import { LOCATION_HISTORY_KEY } from "@/constant";
import { settings as settingsLang } from "@/constant/languages";
import { useAuth } from "@/contexts/AuthContext";
import { useDevMode } from "@/contexts/DevModeContext";
import type { AppLanguage } from "@/contexts/LanguageContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTracking } from "@/contexts/TrackingContext";
import { useTranslation } from "@/hooks/useTranslation";
import { uploadPendingLocations } from "@/services/locationUpload";
import { unregisterMobileDevice } from "@/services/notifier";
import { SERVICE_URL_KEY, getServiceUrl } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { openSettings } from "expo-linking";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DEVICE_ID_KEY = "@tracknest/device_registration_id";

type SettingItem = {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
  disabled?: boolean;
  switchValue?: boolean;
  onSwitchValueChange?: (value: boolean) => void;
  switchDisabled?: boolean;
};

type SettingSection = {
  key: string;
  title: string;
  items: SettingItem[];
};

export default function SettingsScreen() {
  const { language, setLanguage } = useLanguage();
  const { logout, isGuestMode } = useAuth();
  const { tracking, shareLocation, setShareLocation } = useTracking();
  const router = useRouter();
  const t = useTranslation(settingsLang);

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { devMode, setDevMode } = useDevMode();
  const [showDevModal, setShowDevModal] = useState(false);
  const [serverUrl, setServerUrl] = useState("");
  const [serverUrlInput, setServerUrlInput] = useState("");
  const [pendingDevMode, setPendingDevMode] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifStatus, setNotifStatus] = useState<string>("undetermined");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [fgLocationStatus, setFgLocationStatus] =
    useState<string>("undetermined");
  const [bgLocationStatus, setBgLocationStatus] =
    useState<string>("undetermined");
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isManualUploading, setIsManualUploading] = useState(false);

  useEffect(() => {
    getServiceUrl().then((url) => {
      setServerUrl(url);
      setServerUrlInput(url);
    });
  }, []);

  const handleSaveDevOptions = async () => {
    const trimmed = serverUrlInput.trim();
    try {
      if (trimmed) {
        await AsyncStorage.setItem(SERVICE_URL_KEY, trimmed);
      } else {
        await AsyncStorage.removeItem(SERVICE_URL_KEY);
      }
      setServerUrl(trimmed || (process.env.EXPO_PUBLIC_SERVICE_URL ?? ""));
      await setDevMode(pendingDevMode);
      setShowDevModal(false);
      Alert.alert(t.saveSuccessTitle, t.saveSuccessMessage);
    } catch (e: any) {
      Alert.alert(t.errorTitle, e?.message ?? t.saveError);
    }
  };

  const handleLanguageSelect = async (selectedLang: AppLanguage) => {
    await setLanguage(selectedLang);
    setShowLanguageModal(false);
  };

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      try {
        const deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
        if (deviceId) {
          await unregisterMobileDevice(deviceId);
          await AsyncStorage.removeItem(DEVICE_ID_KEY);
        }
      } catch (err) {
        console.warn("Failed to unregister device:", err);
      }
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert(t.errorTitle, t.signOutError);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t.signOutTitle, t.signOutMessage, [
      { text: t.cancelButton, style: "cancel" },
      {
        text: t.signOutButton,
        onPress: performLogout,
        style: "destructive",
      },
    ]);
  };

  const handleLoginFromGuest = () => {
    router.push("/auth/login");
  };

  const openNotifModal = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotifStatus(status);
    setShowNotifModal(true);
  };

  const openLocationModal = async () => {
    const fg = await Location.getForegroundPermissionsAsync();
    setFgLocationStatus(fg.status);
    try {
      const bg = await Location.getBackgroundPermissionsAsync();
      setBgLocationStatus(bg.status);
    } catch {
      setBgLocationStatus("unavailable");
    }
    setShowLocationModal(true);
  };

  const handleRequestNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotifStatus(status);
  };

  const handleRequestForegroundPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setFgLocationStatus(status);
  };

  const handleRequestBackgroundPermission = async () => {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      setBgLocationStatus(status);
    } catch {
      setBgLocationStatus("unavailable");
    }
  };

  const handleClearLocalCache = () => {
    Alert.alert(t.clearLocalCacheTitle, t.clearLocalCacheMessage, [
      { text: t.cancelButton, style: "cancel" },
      {
        text: t.clearButton,
        style: "destructive",
        onPress: async () => {
          try {
            const allKeys = await AsyncStorage.getAllKeys();
            const tracknestKeys = allKeys.filter(
              (key) =>
                key.startsWith("@tracknest/") || key.startsWith("@TrackNest:"),
            );

            if (tracknestKeys.length > 0) {
              await AsyncStorage.multiRemove(tracknestKeys);
            }

            setServerUrl(process.env.EXPO_PUBLIC_SERVICE_URL ?? "");
            setServerUrlInput(process.env.EXPO_PUBLIC_SERVICE_URL ?? "");
            Alert.alert(
              t.clearedTitle,
              t.allLocalDataClearedMessage ?? t.clearedMessage,
            );
          } catch (e: any) {
            Alert.alert(t.errorTitle, e?.message ?? t.clearFailed);
          }
        },
      },
    ]);
  };

  const handleClearLocationHistory = () => {
    Alert.alert(
      t.clearLocationHistoryTitle ?? t.locationHistoryTitle,
      t.clearLocationHistoryMessage,
      [
        { text: t.cancelButton, style: "cancel" },
        {
          text: t.clearButton,
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(LOCATION_HISTORY_KEY);
              Alert.alert(
                t.clearedTitle,
                t.locationHistoryClearedMessage ?? t.clearedMessage,
              );
            } catch (e: any) {
              Alert.alert(t.errorTitle, e?.message ?? t.clearFailed);
            }
          },
        },
      ],
    );
  };

  const handleManualUpload = async () => {
    if (isManualUploading) return;

    setIsManualUploading(true);
    try {
      const result = await uploadPendingLocations(true);

      switch (result.status) {
        case "empty":
          Alert.alert(t.uploadTitle, t.uploadEmptyMessage);
          break;
        case "success":
          Alert.alert(
            t.uploadCompleteTitle,
            t.uploadCompleteMessage.replace(
              "{{count}}",
              String(result.uploaded),
            ),
          );
          break;
        case "no_network":
          Alert.alert(t.noNetworkTitle, t.noNetworkMessage);
          break;
        case "failed":
          Alert.alert(
            t.uploadFailedTitle,
            result.reason
              ? t.uploadFailedMessageWithReason
                  .replace("{{uploaded}}", String(result.uploaded))
                  .replace("{{failed}}", String(result.failed))
                  .replace("{{reason}}", result.reason)
              : t.uploadFailedMessage
                  .replace("{{uploaded}}", String(result.uploaded))
                  .replace("{{failed}}", String(result.failed)),
          );
          break;
        case "auth_paused":
          Alert.alert(
            t.uploadFailedTitle,
            result.reason ??
              "Login required. Upload is paused and will resume after authentication.",
          );
          break;
      }
    } catch (error: any) {
      Alert.alert(t.uploadFailedTitle, error?.message ?? t.uploadUnknownError);
    } finally {
      setIsManualUploading(false);
    }
  };

  const generalItems: SettingItem[] = [
    {
      key: "trackingAlwaysOn",
      title: t.trackingTitle,
      subtitle: t.trackingAlwaysOnSubtitle,
      icon: "locate",
      onPress: () => {},
      disabled: true,
      switchValue: tracking,
      onSwitchValueChange: () => {},
      switchDisabled: false,
    },
    {
      key: "shareLocation",
      title: t.shareLocationTitle,
      subtitle: t.shareLocationSubtitle,
      icon: "share-social-outline",
      onPress: () => setShareLocation(!shareLocation),
      switchValue: shareLocation,
      onSwitchValueChange: setShareLocation,
      switchDisabled: false,
    },
    {
      key: "language",
      title: t.languageTitle,
      subtitle:
        language === "English" ? t.languageEnglishSubtitle : t.languageSubtitle,
      icon: "language",
      onPress: () => setShowLanguageModal(true),
    },
    {
      key: "location",
      title: t.locationTitle,
      subtitle: t.locationSubtitle,
      icon: "location-outline",
      onPress: openLocationModal,
    },
    {
      key: "notifications",
      title: t.notificationsTitle,
      subtitle: t.notificationsSubtitle,
      icon: "notifications",
      onPress: openNotifModal,
    },
  ];

  const mapsAndSafetyItems: SettingItem[] = [
    {
      key: "locationHistory",
      title: t.locationHistoryTitle,
      subtitle: t.locationHistorySubtitle,
      icon: "map-outline",
      onPress: () => router.push("../location-history"),
    },
    {
      key: "safeZones",
      title: t.safeZonesTitle,
      subtitle: t.safeZonesSubtitle,
      icon: "shield-checkmark-outline",
      onPress: () => router.push("../safe-zones"),
    },
    {
      key: "crimeHeatmap",
      title: t.crimeHeatmapTitle,
      subtitle: t.crimeHeatmapSubtitle,
      icon: "flame-outline",
      onPress: () => router.push("../crime-heatmap"),
    },
  ];

  const syncItems: SettingItem[] = [
    {
      key: "uploadPendingLocations",
      title: t.uploadPendingTitle,
      subtitle: isManualUploading
        ? t.uploadPendingInProgressSubtitle
        : t.uploadPendingSubtitle,
      icon: "cloud-upload-outline",
      onPress: handleManualUpload,
      disabled: isManualUploading,
    },
  ];

  const privacyAndDevItems: SettingItem[] = [
    {
      key: "privacy",
      title: t.privacyTitle,
      subtitle: t.privacySubtitle,
      icon: "shield-checkmark",
      onPress: () => setShowPrivacyModal(true),
    },
    {
      key: "developerOptions",
      title: t.developerOptionsTitle,
      subtitle: devMode ? t.developerOptionsOn : t.developerOptionsOff,
      icon: "code-slash-outline",
      onPress: () => {
        setServerUrlInput(serverUrl);
        setPendingDevMode(devMode);
        setShowDevModal(true);
      },
    },
  ];

  const supportItems: SettingItem[] = [
    {
      key: "help",
      title: t.helpTitle,
      subtitle: t.helpSubtitle,
      icon: "help-circle",
      onPress: () => Alert.alert(t.helpTitle, t.helpComingSoon),
    },
  ];

  const sections: SettingSection[] = [
    {
      key: "general",
      title: t.sectionGeneral,
      items: generalItems,
    },
    {
      key: "mapsAndSafety",
      title: t.sectionMapsAndSafety,
      items: mapsAndSafetyItems,
    },
    {
      key: "sync",
      title: t.sectionSync,
      items: syncItems,
    },
    {
      key: "privacyAndDev",
      title: t.sectionPrivacyAndDeveloper,
      items: privacyAndDevItems,
    },
    {
      key: "support",
      title: t.sectionSupport,
      items: supportItems,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{t.pageTitle}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {sections.map((section) => (
          <View key={section.key} style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((it, index) => (
                <Pressable
                  key={it.key}
                  style={[
                    styles.row,
                    index === section.items.length - 1 && styles.rowLast,
                    it.disabled && { opacity: 0.6 },
                  ]}
                  onPress={it.onPress}
                  disabled={it.disabled}
                  android_ripple={{ color: "#e5e7eb" }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <View style={styles.iconWrap}>
                      <Ionicons
                        name={it.icon as any}
                        size={20}
                        color="#74becb"
                      />
                    </View>
                    <View>
                      <Text style={styles.rowTitle}>{it.title}</Text>
                      {it.subtitle ? (
                        <Text style={styles.rowSubtitle}>{it.subtitle}</Text>
                      ) : null}
                    </View>
                  </View>
                  {it.switchValue !== undefined ? (
                    <Switch
                      value={it.switchValue}
                      onValueChange={
                        it.onSwitchValueChange ?? (() => it.onPress())
                      }
                      trackColor={{ false: "#d1d5db", true: "#74becb" }}
                      thumbColor={it.switchValue ? "#ffffff" : "#f4f3f4"}
                      ios_backgroundColor="#d1d5db"
                      disabled={it.switchDisabled}
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color="#999" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>{t.sectionAccount}</Text>
          {isGuestMode ? (
            <Pressable style={styles.loginRow} onPress={handleLoginFromGuest}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <View style={[styles.iconWrap, { backgroundColor: "#e8f4ff" }]}>
                  <Ionicons name="log-in-outline" size={20} color="#1d4ed8" />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { color: "#1d4ed8" }]}>
                    {t.guestLoginTitle}
                  </Text>
                  <Text style={styles.rowSubtitle}>{t.guestLoginSubtitle}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </Pressable>
          ) : (
            <Pressable
              style={styles.signOutRow}
              onPress={handleLogout}
              disabled={isLoggingOut}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <View style={[styles.iconWrap, { backgroundColor: "#fdeaea" }]}>
                  {isLoggingOut ? (
                    <ActivityIndicator size="small" color="#e74c3c" />
                  ) : (
                    <Ionicons name="log-out" size={20} color="#e74c3c" />
                  )}
                </View>
                <Text style={[styles.rowTitle, { color: "#e74c3c" }]}>
                  {isLoggingOut ? t.signingOut : t.signOutButton}
                </Text>
              </View>
              {!isLoggingOut && (
                <Ionicons name="chevron-forward" size={18} color="#999" />
              )}
            </Pressable>
          )}
        </View>

        <View style={styles.footerWrap}>
          <Text style={{ color: "#999" }}>{t.appName}</Text>
          <Text style={{ color: "#999", marginTop: 4 }}>
            {t.versionLabel} 1.0.0
          </Text>
        </View>
      </ScrollView>

      <LanguageModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        language={language}
        onSelectLanguage={handleLanguageSelect}
        t={t}
      />

      <NotificationPermissionsModal
        visible={showNotifModal}
        onClose={() => setShowNotifModal(false)}
        notifStatus={notifStatus}
        onRequestPermission={handleRequestNotificationPermission}
        onOpenSystemSettings={openSettings}
        t={t}
      />

      <LocationPermissionsModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        fgLocationStatus={fgLocationStatus}
        bgLocationStatus={bgLocationStatus}
        onRequestForegroundPermission={handleRequestForegroundPermission}
        onRequestBackgroundPermission={handleRequestBackgroundPermission}
        onOpenSystemSettings={openSettings}
        t={t}
      />

      <PrivacyModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onClearLocationHistory={handleClearLocationHistory}
        onClearLocalCache={handleClearLocalCache}
        t={t}
      />

      <DeveloperOptionsModal
        visible={showDevModal}
        onClose={() => setShowDevModal(false)}
        serverUrlInput={serverUrlInput}
        onChangeServerUrlInput={setServerUrlInput}
        pendingDevMode={pendingDevMode}
        onChangePendingDevMode={setPendingDevMode}
        onSave={handleSaveDevOptions}
        defaultServiceUrl={process.env.EXPO_PUBLIC_SERVICE_URL ?? ""}
        t={t}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 18,
  },
  headerRow: {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  sectionWrap: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
  },
  rowLast: {
    borderBottomWidth: 0,
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
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fde2e2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  loginRow: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerWrap: {
    alignItems: "center",
    marginTop: 18,
  },
});
