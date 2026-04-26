import * as Clipboard from "expo-clipboard";
import * as Notifications from "expo-notifications";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { notificationTest as notificationTestLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { registerMobileDevice } from "@/services/notifier";
import { colors, spacing } from "@/styles/styles";
import {
  registerForPushNotificationsAsync,
  setupNotificationChannels,
} from "@/utils/notifications";

export default function NotificationTestScreen() {
  const t = useTranslation(notificationTestLang);
  // ── FCM Token ──
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isFetchingToken, setIsFetchingToken] = useState(false);

  // ── Register with backend ──
  const [regLang, setRegLang] = useState("en");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerResult, setRegisterResult] = useState<string | null>(null);

  // ── Permission status ──
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);

  // ── Schedule local notification ──
  const [localTitle, setLocalTitle] = useState("Test Notification");
  const [localBody, setLocalBody] = useState(
    "This is a test push notification from FCM test screen",
  );
  const [localDataRoute, setLocalDataRoute] = useState("");
  const [delaySec, setDelaySec] = useState("3");
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<string | null>(null);

  // ── Notification log ──
  const [notificationLog, setNotificationLog] = useState<string[]>([]);

  // Listen for incoming notifications and log them
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body, data } = notification.request.content;
        const entry = `[${new Date().toLocaleTimeString()}] Received: "${title}" - ${body} | data: ${JSON.stringify(data)}`;
        setNotificationLog((prev) => [entry, ...prev].slice(0, 20));
      },
    );

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { title, data } = response.notification.request.content;
        const entry = `[${new Date().toLocaleTimeString()}] Tapped: "${title}" | data: ${JSON.stringify(data)}`;
        setNotificationLog((prev) => [entry, ...prev].slice(0, 20));
      },
    );

    return () => {
      sub.remove();
      responseSub.remove();
    };
  }, []);

  // ───────── Handlers ─────────

  const handleGetFCMToken = useCallback(async () => {
    try {
      setIsFetchingToken(true);
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setFcmToken(token);
      } else {
        Alert.alert(t.noTokenTitle, t.noTokenMessage);
      }
    } catch (e: any) {
      Alert.alert(t.errorTitle, e.message);
    } finally {
      setIsFetchingToken(false);
    }
  }, [t.errorTitle, t.noTokenMessage, t.noTokenTitle]);

  const handleCopyToken = useCallback(async () => {
    if (fcmToken) {
      await Clipboard.setStringAsync(fcmToken);
      Alert.alert(t.copiedTitle, t.copiedTokenMessage);
    }
  }, [fcmToken, t.copiedTitle, t.copiedTokenMessage]);

  const handleCheckPermission = useCallback(async () => {
    try {
      setIsCheckingPermission(true);
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    } catch (e: any) {
      Alert.alert(t.errorTitle, e.message);
    } finally {
      setIsCheckingPermission(false);
    }
  }, [t.errorTitle]);

  const handleRequestPermission = useCallback(async () => {
    try {
      setIsCheckingPermission(true);
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      await setupNotificationChannels();
    } catch (e: any) {
      Alert.alert(t.errorTitle, e.message);
    } finally {
      setIsCheckingPermission(false);
    }
  }, [t.errorTitle]);

  const handleRegisterWithBackend = useCallback(async () => {
    if (!fcmToken) {
      Alert.alert(t.errorTitle, t.getTokenFirst);
      return;
    }
    try {
      setIsRegistering(true);
      setRegisterResult(null);
      const platform = Platform.OS;
      const res = await registerMobileDevice(fcmToken, platform, regLang);
      setRegisterResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      Alert.alert(t.errorTitle, e.message);
    } finally {
      setIsRegistering(false);
    }
  }, [fcmToken, regLang, t.errorTitle, t.getTokenFirst]);

  const handleScheduleLocal = useCallback(async () => {
    const seconds = parseInt(delaySec, 10);
    if (isNaN(seconds) || seconds < 1) {
      Alert.alert(t.errorTitle, t.delayAtLeastOne);
      return;
    }
    try {
      setIsScheduling(true);
      setScheduleResult(null);

      const data: Record<string, string> = {};
      if (localDataRoute.trim()) {
        data.route = localDataRoute.trim();
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: localTitle || "Test",
          body: localBody || t.testDefaultBody,
          data,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
        },
      });
      setScheduleResult(`Scheduled! ID: ${id}\nWill fire in ${seconds}s`);
    } catch (e: any) {
      Alert.alert(t.errorTitle, e.message);
    } finally {
      setIsScheduling(false);
    }
  }, [
    localTitle,
    localBody,
    localDataRoute,
    delaySec,
    t.delayAtLeastOne,
    t.errorTitle,
    t.testDefaultBody,
  ]);

  const handleCancelAll = useCallback(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    Alert.alert(t.doneTitle, t.cancelledAllScheduled);
    setScheduleResult(null);
  }, [t.cancelledAllScheduled, t.doneTitle]);

  const handleDismissAll = useCallback(async () => {
    await Notifications.dismissAllNotificationsAsync();
    Alert.alert(t.doneTitle, t.dismissedAllDelivered);
  }, [t.dismissedAllDelivered, t.doneTitle]);

  const handleGetBadgeCount = useCallback(async () => {
    const count = await Notifications.getBadgeCountAsync();
    Alert.alert(
      t.badgeCountTitle,
      t.badgeCountMessage.replace("{{count}}", String(count)),
    );
  }, [t.badgeCountMessage, t.badgeCountTitle]);

  const handleClearLog = useCallback(() => {
    setNotificationLog([]);
  }, []);

  // ───────── Render helpers ─────────

  const ResultBox = ({ result }: { result: string | null }) =>
    result ? (
      <View style={styles.resultBox}>
        <Text style={styles.resultTitle}>{t.result}</Text>
        <Text style={styles.resultText}>{result}</Text>
      </View>
    ) : null;

  const ActionButton = ({
    label,
    loading,
    onPress,
    variant = "primary",
  }: {
    label: string;
    loading?: boolean;
    onPress: () => void;
    variant?: "primary" | "success" | "danger" | "warning";
  }) => (
    <TouchableOpacity
      style={[
        styles.button,
        variant === "success" && styles.buttonSuccess,
        variant === "danger" && styles.buttonDanger,
        variant === "warning" && styles.buttonWarning,
        loading && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={styles.buttonText}>{label}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t.title}</Text>

        {/* ── 1. Permission ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionPermission}</Text>
          {permissionStatus && (
            <View
              style={[
                styles.statusBadge,
                permissionStatus === "granted"
                  ? styles.statusGranted
                  : styles.statusDenied,
              ]}
            >
              <Text style={styles.statusText}>
                {t.status}: {permissionStatus}
              </Text>
            </View>
          )}
          <View style={styles.buttonRow}>
            <ActionButton
              label={t.checkPermission}
              loading={isCheckingPermission}
              onPress={handleCheckPermission}
            />
            <ActionButton
              label={t.requestPermission}
              loading={isCheckingPermission}
              onPress={handleRequestPermission}
              variant="success"
            />
          </View>
        </View>

        {/* ── 2. FCM Token ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionFcm}</Text>
          <ActionButton
            label={t.getFcmToken}
            loading={isFetchingToken}
            onPress={handleGetFCMToken}
            variant="success"
          />
          {fcmToken && (
            <View style={styles.tokenBox}>
              <Text style={styles.tokenLabel}>{t.fcmTokenLabel}</Text>
              <Text style={styles.tokenText} selectable>
                {fcmToken}
              </Text>
              <ActionButton label={t.copyToken} onPress={handleCopyToken} />
            </View>
          )}
        </View>

        {/* ── 3. Register with Backend ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionRegisterBackend}</Text>
          <Text style={styles.hint}>{t.registerHint}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.languageCodePlaceholder}
            placeholderTextColor={colors.textMuted}
            value={regLang}
            onChangeText={setRegLang}
          />
          <ActionButton
            label={fcmToken ? t.registerWithBackend : t.getTokenFirstButton}
            loading={isRegistering}
            onPress={handleRegisterWithBackend}
            variant="success"
          />
          <ResultBox result={registerResult} />
        </View>

        {/* ── 4. Schedule Local Notification ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionScheduleLocal}</Text>
          <Text style={styles.hint}>{t.scheduleHint}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.titlePlaceholder}
            placeholderTextColor={colors.textMuted}
            value={localTitle}
            onChangeText={setLocalTitle}
          />
          <TextInput
            style={styles.input}
            placeholder={t.bodyPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={localBody}
            onChangeText={setLocalBody}
          />
          <TextInput
            style={styles.input}
            placeholder={t.dataRoutePlaceholder}
            placeholderTextColor={colors.textMuted}
            value={localDataRoute}
            onChangeText={setLocalDataRoute}
          />
          <TextInput
            style={styles.input}
            placeholder={t.delaySecondsPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={delaySec}
            onChangeText={setDelaySec}
            keyboardType="numeric"
          />
          <ActionButton
            label={t.scheduleNotification}
            loading={isScheduling}
            onPress={handleScheduleLocal}
          />
          <ResultBox result={scheduleResult} />
        </View>

        {/* ── 5. Manage Notifications ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionManage}</Text>
          <View style={styles.buttonColumn}>
            <ActionButton
              label={t.cancelAllScheduled}
              onPress={handleCancelAll}
              variant="warning"
            />
            <ActionButton
              label={t.dismissAllDelivered}
              onPress={handleDismissAll}
              variant="warning"
            />
            <ActionButton
              label={t.getBadgeCount}
              onPress={handleGetBadgeCount}
            />
          </View>
        </View>

        {/* ── 6. Notification Log ── */}
        <View style={styles.section}>
          <View style={styles.logHeader}>
            <Text style={styles.sectionTitle}>{t.sectionLog}</Text>
            <TouchableOpacity onPress={handleClearLog}>
              <Text style={styles.clearText}>{t.clear}</Text>
            </TouchableOpacity>
          </View>
          {notificationLog.length === 0 ? (
            <Text style={styles.hint}>{t.emptyLogHint}</Text>
          ) : (
            notificationLog.map((entry, i) => (
              <View key={i} style={styles.logEntry}>
                <Text style={styles.logText}>{entry}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  section: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  buttonSuccess: {
    backgroundColor: colors.success,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
  },
  buttonWarning: {
    backgroundColor: "#f59e0b",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  buttonColumn: {
    gap: spacing.sm,
  },
  statusBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    alignSelf: "flex-start",
  },
  statusGranted: {
    backgroundColor: colors.successLight,
  },
  statusDenied: {
    backgroundColor: colors.dangerLight,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  tokenBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  tokenLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tokenText: {
    fontSize: 11,
    fontFamily: "monospace",
    color: colors.textPrimary,
  },
  resultBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  resultText: {
    fontSize: 12,
    fontFamily: "monospace",
    color: colors.textPrimary,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  clearText: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: "600",
  },
  logEntry: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  logText: {
    fontSize: 12,
    fontFamily: "monospace",
    color: colors.textPrimary,
  },
});
