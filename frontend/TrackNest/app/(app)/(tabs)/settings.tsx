import { DeveloperOptionsModal } from "@/components/SettingsModals/DeveloperOptionsModal";
import { LanguageModal } from "@/components/SettingsModals/LanguageModal";
import { LocationPermissionsModal } from "@/components/SettingsModals/LocationPermissionsModal";
import { NotificationPermissionsModal } from "@/components/SettingsModals/NotificationPermissionsModal";
import { PermissionsSummaryModal } from "@/components/SettingsModals/PermissionsSummaryModal";
import { PrivacyModal } from "@/components/SettingsModals/PrivacyModal";
import { LOCATION_HISTORY_KEY } from "@/constant";
import { settings as settingsLang } from "@/constant/languages";
import { useAuth } from "@/contexts/AuthContext";
import { useDevMode } from "@/contexts/DevModeContext";
import type { AppLanguage } from "@/contexts/LanguageContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useTracking } from "@/contexts/TrackingContext";
import { useTranslation } from "@/hooks/useTranslation";
import { uploadPendingLocations } from "@/services/locationUpload";
import { unregisterMobileDevice } from "@/services/notifier";
import { colors, radii, spacing } from "@/styles/styles";
import {
  CRIMINAL_URL_KEY,
  EMERGENCY_URL_KEY,
  GRPC_URL_KEY,
  SERVICE_URL_KEY,
  getCriminalUrl,
  getEmergencyUrl,
  getGrpcUrl,
  getServiceUrl,
  showToast,
} from "@/utils";
import {
  requestPermissionsAndStart,
  stopBackgroundLocationTracking,
} from "@/utils/backgroundLocation";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { openSettings } from "expo-linking";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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

// ─── Setting Row ──────────────────────────────────────────────────────────────

function SettingRow({
  icon,
  title,
  subtitle,
  onPress,
  disabled,
  switchValue,
  onSwitchChange,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  disabled?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (v: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.row,
        isLast && styles.rowLast,
        disabled && { opacity: 0.5 },
      ]}
      onPress={onPress}
      disabled={disabled || !onPress}
      android_ripple={{ color: "#e5e7eb" }}
    >
      <View style={styles.rowLeft}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <View style={styles.rowTexts}>
          <Text style={styles.rowTitle}>{title}</Text>
          {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {switchValue !== undefined ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange ?? (() => onPress?.())}
          trackColor={{ false: "#d1d5db", true: colors.primary }}
          thumbColor="#ffffff"
          ios_backgroundColor="#d1d5db"
        />
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#c4c4c4" />
      )}
    </Pressable>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { language, setLanguage } = useLanguage();
  const { logout, isGuestMode } = useAuth();
  useTracking(); // keep context subscription alive
  const { profile, exportUserData, privacySettings, updatePrivacySetting } =
    useProfile();
  const { guardians, voiceSettings, setVoiceEnabled } = useSettings();
  const router = useRouter();
  const t = useTranslation(settingsLang);

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { devMode, setDevMode } = useDevMode();
  const [showDevModal, setShowDevModal] = useState(false);
  const [serverUrl, setServerUrl] = useState("");
  const [serverUrlInput, setServerUrlInput] = useState("");
  const [emergencyUrl, setEmergencyUrl] = useState("");
  const [emergencyUrlInput, setEmergencyUrlInput] = useState("");
  const [criminalUrl, setCriminalUrl] = useState("");
  const [criminalUrlInput, setCriminalUrlInput] = useState("");
  const [grpcUrl, setGrpcUrl] = useState("");
  const [grpcUrlInput, setGrpcUrlInput] = useState("");
  const [pendingDevMode, setPendingDevMode] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifStatus, setNotifStatus] = useState<string>("undetermined");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [fgLocationStatus, setFgLocationStatus] =
    useState<string>("undetermined");
  const [bgLocationStatus, setBgLocationStatus] =
    useState<string>("undetermined");
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showPermissionsSummaryModal, setShowPermissionsSummaryModal] =
    useState(false);
  const [isManualUploading, setIsManualUploading] = useState(false);

  // Footer triple tap logic
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<any>(null);

  const { tracking, shareLocation, setShareLocation } = useTracking();

  useEffect(() => {
    Promise.all([
      getServiceUrl(),
      getEmergencyUrl(),
      getCriminalUrl(),
      getGrpcUrl(),
    ]).then(([svcUrl, emUrl, crUrl, grpcUrlVal]) => {
      setServerUrl(svcUrl);
      setServerUrlInput(svcUrl);
      setEmergencyUrl(emUrl);
      setEmergencyUrlInput(emUrl);
      setCriminalUrl(crUrl);
      setCriminalUrlInput(crUrl);
      setGrpcUrl(grpcUrlVal);
      setGrpcUrlInput(grpcUrlVal);
    });
  }, []);

  const upsertServiceUrl = async (key: string, value: string) => {
    if (value) await AsyncStorage.setItem(key, value);
    else await AsyncStorage.removeItem(key);
  };

  const handleSaveDevOptions = async () => {
    const ts = serverUrlInput.trim();
    const te = emergencyUrlInput.trim();
    const tc = criminalUrlInput.trim();
    const tg = grpcUrlInput.trim();
    try {
      await Promise.all([
        upsertServiceUrl(SERVICE_URL_KEY, ts),
        upsertServiceUrl(EMERGENCY_URL_KEY, te),
        upsertServiceUrl(CRIMINAL_URL_KEY, tc),
        upsertServiceUrl(GRPC_URL_KEY, tg),
      ]);
      setServerUrl(ts);
      setServerUrlInput(ts);
      setEmergencyUrl(te);
      setEmergencyUrlInput(te);
      setCriminalUrl(tc);
      setCriminalUrlInput(tc);
      setGrpcUrl(tg);
      setGrpcUrlInput(tg);
      await setDevMode(pendingDevMode);
      setShowDevModal(false);
      showToast(t.saveSuccessMessage, t.saveSuccessTitle);
    } catch (e: any) {
      showToast(e?.message ?? t.saveError, t.errorTitle);
    }
  };

  const handleLanguageSelect = async (selectedLang: AppLanguage) => {
    await setLanguage(selectedLang);
    setShowLanguageModal(false);
  };

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      const deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (deviceId) {
        await unregisterMobileDevice(deviceId).catch(() => {});
        await AsyncStorage.removeItem(DEVICE_ID_KEY);
      }
      await logout();
    } catch {
      showToast(t.signOutError, t.errorTitle);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t.signOutTitle, t.signOutMessage, [
      { text: t.cancelButton, style: "cancel" },
      { text: t.signOutButton, onPress: performLogout, style: "destructive" },
    ]);
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

  const openPermissionsSummaryModal = async () => {
    const notif = await Notifications.getPermissionsAsync();
    setNotifStatus(notif.status);

    const fg = await Location.getForegroundPermissionsAsync();
    setFgLocationStatus(fg.status);

    try {
      const bg = await Location.getBackgroundPermissionsAsync();
      setBgLocationStatus(bg.status);
    } catch {
      setBgLocationStatus("unavailable");
    }

    setShowPermissionsSummaryModal(true);
  };

  const handleToggleShareLocation = async (value: boolean) => {
    setShareLocation(value);
    if (value) {
      await requestPermissionsAndStart();
    } else {
      await stopBackgroundLocationTracking();
    }
  };

  const handleFooterTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      setServerUrlInput(serverUrl);
      setEmergencyUrlInput(emergencyUrl);
      setCriminalUrlInput(criminalUrl);
      setPendingDevMode(devMode);
      setShowDevModal(true);
    } else {
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, 500);
    }
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
            const keys = allKeys.filter(
              (k) => k.startsWith("@tracknest/") || k.startsWith("@TrackNest:"),
            );
            if (keys.length > 0) await AsyncStorage.multiRemove(keys);
            showToast(t.allLocalDataClearedMessage ?? t.clearedMessage, t.clearedTitle);
          } catch (e: any) {
            showToast(e?.message ?? t.clearFailed, t.errorTitle);
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
              showToast(t.locationHistoryClearedMessage ?? t.clearedMessage, t.clearedTitle);
            } catch (e: any) {
              showToast(e?.message ?? t.clearFailed, t.errorTitle);
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
          showToast(t.uploadEmptyMessage, t.uploadTitle);
          break;
        case "success":
          showToast(
            t.uploadCompleteMessage.replace("{{count}}", String(result.uploaded)),
            t.uploadCompleteTitle,
          );
          break;
        case "no_network":
          showToast(t.noNetworkMessage, t.noNetworkTitle);
          break;
        default:
          showToast(
            (t.uploadFailedMessage ?? "")
              .replace("{{uploaded}}", String(result.uploaded ?? 0))
              .replace("{{failed}}", String((result as any).failed ?? 0)),
            t.uploadFailedTitle,
          );
      }
    } catch (error: any) {
      showToast(error?.message ?? t.uploadUnknownError, t.uploadFailedTitle);
    } finally {
      setIsManualUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <Text style={styles.pageTitle}>{t.pageTitle}</Text>
        <Text style={styles.pageSubtitle}>{t.pageSubtitle}</Text>

        {/* General */}
        <SectionCard title={t.sectionGeneral}>
          <SettingRow
            icon="people-outline"
            title={t.manageCirclesTitle}
            subtitle={t.manageCirclesSettingsSubtitle}
            onPress={() => router.push("/(app)/family-circles/new" as any)}
          />
          <SettingRow
            icon="notifications-outline"
            title={t.notificationsTitle}
            subtitle={t.notificationsSubtitle}
            onPress={openNotifModal}
            isLast
          />
        </SectionCard>

        {/* Maps & Safety */}
        <SectionCard title={t.sectionMapsAndSafety}>
          <SettingRow
            icon="time-outline"
            title={t.locationHistoryTitle}
            onPress={() => router.push("../location-history")}
          />
          <SettingRow
            icon="location-outline"
            title={t.shareLocationTitle || "Share Background Location"}
            subtitle={
              t.shareLocationSubtitle ||
              "Continuously upload location to family"
            }
            switchValue={shareLocation}
            onSwitchChange={handleToggleShareLocation}
          />
          <SettingRow
            icon="mic-outline"
            title={t.voiceSosCommandTitle}
            subtitle={voiceSettings.enabled ? t.enabled : t.disabled}
            onPress={() => setVoiceEnabled(!voiceSettings.enabled)}
            switchValue={voiceSettings.enabled}
            onSwitchChange={setVoiceEnabled}
            isLast
          />
        </SectionCard>

        {/* Privacy */}
        <SectionCard title={t.sectionPrivacy}>
          <SettingRow
            icon="lock-closed-outline"
            title={t.dataPermissionsTitle || "App Permissions Summary"}
            subtitle={t.dataPermissionsSubtitle || "View granted permissions"}
            onPress={openPermissionsSummaryModal}
            isLast
          />
        </SectionCard>

        {/* Developer options — only in dev mode */}
        {devMode && (
          <SectionCard title={t.developerSectionTitle}>
            <SettingRow
              icon="cloud-upload-outline"
              title={t.uploadPendingTitle}
              subtitle={
                isManualUploading
                  ? t.uploadPendingInProgressSubtitle
                  : t.uploadPendingSubtitle
              }
              onPress={handleManualUpload}
              disabled={isManualUploading}
              isLast
            />
          </SectionCard>
        )}

        {/* Sign Out */}
        <View style={styles.signOutWrap}>
          {isGuestMode ? (
            <Pressable
              style={styles.loginBtn}
              onPress={() => router.push("/auth/login")}
            >
              <Ionicons name="log-in-outline" size={20} color="#1d4ed8" />
              <Text style={styles.loginBtnText}>{t.guestLoginTitle}</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.signOutBtn}
              onPress={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              ) : (
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color={colors.textSecondary}
                />
              )}
              <Text style={styles.signOutBtnText}>
                {isLoggingOut ? t.signingOut : t.signOutButton}
              </Text>
            </Pressable>
          )}
        </View>

        <Pressable onPress={handleFooterTap} style={styles.footerContainer}>
          <Text style={styles.footerText}>
            TrackNest - Empowering family safety
          </Text>
        </Pressable>

        <View style={{ height: spacing.xl }} />
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
      <PermissionsSummaryModal
        visible={showPermissionsSummaryModal}
        onClose={() => setShowPermissionsSummaryModal(false)}
        fgLocationStatus={fgLocationStatus}
        bgLocationStatus={bgLocationStatus}
        notifStatus={notifStatus}
        onRequestForegroundPermission={handleRequestForegroundPermission}
        onRequestBackgroundPermission={handleRequestBackgroundPermission}
        onRequestNotificationPermission={handleRequestNotificationPermission}
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
        emergencyUrlInput={emergencyUrlInput}
        onChangeEmergencyUrlInput={setEmergencyUrlInput}
        criminalUrlInput={criminalUrlInput}
        onChangeCriminalUrlInput={setCriminalUrlInput}
        grpcUrlInput={grpcUrlInput}
        onChangeGrpcUrlInput={setGrpcUrlInput}
        pendingDevMode={pendingDevMode}
        onChangePendingDevMode={setPendingDevMode}
        onSave={handleSaveDevOptions}
        t={t}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7fa" },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: 4 },

  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
    marginTop: spacing.sm,
  },
  pageSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },

  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 10,
    marginLeft: 2,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#edf2f7",
    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  rowLast: { borderBottomWidth: 0 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(116,190,203,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowTexts: { flex: 1 },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  rowSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  signOutWrap: { marginTop: spacing.sm, marginBottom: spacing.md },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#f0f0f0",
    paddingVertical: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  signOutBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#eff6ff",
    paddingVertical: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1d4ed8",
  },
  footerContainer: {
    paddingVertical: 16,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "500",
  },
});
