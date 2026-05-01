import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { showToast } from "@/utils";

import { notifierTest as notifierTestLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import {
  clearRiskNotifications,
  clearTrackingNotifications,
  countRiskNotifications,
  countTrackingNotifications,
  deleteRiskNotification,
  deleteRiskNotifications,
  deleteTrackingNotification,
  deleteTrackingNotifications,
  listRiskNotifications,
  listTrackingNotifications,
  registerMobileDevice,
  unregisterMobileDevice,
  updateMobileDevice,
} from "@/services/notifier";
import { colors, spacing } from "@/styles/styles";

export default function NotifierTestScreen() {
  const t = useTranslation(notifierTestLang);
  // ── Register Mobile Device ──
  const [regDeviceToken, setRegDeviceToken] = useState("");
  const [regPlatform, setRegPlatform] = useState("android");
  const [regLang, setRegLang] = useState("en");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerResult, setRegisterResult] = useState<string | null>(null);

  // ── Update Mobile Device ──
  const [updateId, setUpdateId] = useState("");
  const [updateDeviceToken, setUpdateDeviceToken] = useState("");
  const [updatePlatform, setUpdatePlatform] = useState("android");
  const [updateLang, setUpdateLang] = useState("en");
  const [isUpdatingDevice, setIsUpdatingDevice] = useState(false);
  const [updateDeviceResult, setUpdateDeviceResult] = useState<string | null>(
    null,
  );

  // ── Unregister Mobile Device ──
  const [unregId, setUnregId] = useState("");
  const [isUnregistering, setIsUnregistering] = useState(false);
  const [unregisterResult, setUnregisterResult] = useState<string | null>(null);

  // ── List Tracking Notifications ──
  const [trackPageSize, setTrackPageSize] = useState("10");
  const [trackPageToken, setTrackPageToken] = useState("");
  const [isListingTrack, setIsListingTrack] = useState(false);
  const [listTrackResult, setListTrackResult] = useState<string | null>(null);

  // ── Delete Single Tracking Notification ──
  const [delTrackId, setDelTrackId] = useState("");
  const [isDeletingTrack, setIsDeletingTrack] = useState(false);
  const [delTrackResult, setDelTrackResult] = useState<string | null>(null);

  // ── Delete Multiple Tracking Notifications ──
  const [delTrackIds, setDelTrackIds] = useState("");
  const [isDeletingTracks, setIsDeletingTracks] = useState(false);
  const [delTracksResult, setDelTracksResult] = useState<string | null>(null);

  // ── Clear Tracking Notifications ──
  const [isClearingTrack, setIsClearingTrack] = useState(false);
  const [clearTrackResult, setClearTrackResult] = useState<string | null>(null);

  // ── Count Tracking Notifications ──
  const [isCountingTrack, setIsCountingTrack] = useState(false);
  const [countTrackResult, setCountTrackResult] = useState<string | null>(null);

  // ── List Risk Notifications ──
  const [riskPageSize, setRiskPageSize] = useState("10");
  const [riskPageToken, setRiskPageToken] = useState("");
  const [isListingRisk, setIsListingRisk] = useState(false);
  const [listRiskResult, setListRiskResult] = useState<string | null>(null);

  // ── Delete Single Risk Notification ──
  const [delRiskId, setDelRiskId] = useState("");
  const [isDeletingRisk, setIsDeletingRisk] = useState(false);
  const [delRiskResult, setDelRiskResult] = useState<string | null>(null);

  // ── Delete Multiple Risk Notifications ──
  const [delRiskIds, setDelRiskIds] = useState("");
  const [isDeletingRisks, setIsDeletingRisks] = useState(false);
  const [delRisksResult, setDelRisksResult] = useState<string | null>(null);

  // ── Clear Risk Notifications ──
  const [isClearingRisk, setIsClearingRisk] = useState(false);
  const [clearRiskResult, setClearRiskResult] = useState<string | null>(null);

  // ── Count Risk Notifications ──
  const [isCountingRisk, setIsCountingRisk] = useState(false);
  const [countRiskResult, setCountRiskResult] = useState<string | null>(null);

  // ───────── Handlers ─────────

  const handleRegisterDevice = useCallback(async () => {
    if (!regDeviceToken.trim()) {
      showToast(t.enterDeviceToken, t.errorTitle);
      return;
    }
    try {
      setIsRegistering(true);
      setRegisterResult(null);
      const res = await registerMobileDevice(
        regDeviceToken,
        regPlatform,
        regLang,
      );
      setRegisterResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      showToast(e.message, t.errorTitle);
    } finally {
      setIsRegistering(false);
    }
  }, [regDeviceToken, regPlatform, regLang, t.enterDeviceToken, t.errorTitle]);

  const handleUpdateDevice = useCallback(async () => {
    if (!updateId.trim() || !updateDeviceToken.trim()) {
      showToast(t.enterIdAndToken, t.errorTitle);
      return;
    }
    try {
      setIsUpdatingDevice(true);
      setUpdateDeviceResult(null);
      const res = await updateMobileDevice(
        updateId,
        updateDeviceToken,
        updatePlatform,
        updateLang,
      );
      setUpdateDeviceResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      showToast(e.message, t.errorTitle);
    } finally {
      setIsUpdatingDevice(false);
    }
  }, [
    updateId,
    updateDeviceToken,
    updatePlatform,
    updateLang,
    t.enterIdAndToken,
    t.errorTitle,
  ]);

  const handleUnregisterDevice = useCallback(async () => {
    if (!unregId.trim()) {
      showToast(t.enterDeviceId, t.errorTitle);
      return;
    }
    try {
      setIsUnregistering(true);
      setUnregisterResult(null);
      const res = await unregisterMobileDevice(unregId);
      setUnregisterResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      showToast(e.message, t.errorTitle);
    } finally {
      setIsUnregistering(false);
    }
  }, [unregId, t.enterDeviceId, t.errorTitle]);

  const handleListTrackingNotifications = useCallback(async () => {
    const size = parseInt(trackPageSize, 10);
    if (isNaN(size) || size <= 0) {
      showToast(t.validPageSize, t.errorTitle);
      return;
    }
    try {
      setIsListingTrack(true);
      setListTrackResult(null);
      const res = await listTrackingNotifications(
        size,
        trackPageToken || undefined,
      );
      setListTrackResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      showToast(e.message, t.errorTitle);
    } finally {
      setIsListingTrack(false);
    }
  }, [trackPageSize, trackPageToken, t.errorTitle, t.validPageSize]);

  const handleDeleteTrackingNotification = useCallback(async () => {
    if (!delTrackId.trim()) {
      showToast(t.enterNotificationId, t.errorTitle);
      return;
    }
    try {
      setIsDeletingTrack(true);
      setDelTrackResult(null);
      const res = await deleteTrackingNotification(delTrackId);
      setDelTrackResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      showToast(e.message, t.errorTitle);
    } finally {
      setIsDeletingTrack(false);
    }
  }, [delTrackId, t.enterNotificationId, t.errorTitle]);

  const handleDeleteTrackingNotifications = useCallback(async () => {
    const ids = delTrackIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) {
      showToast(t.enterCommaIds, t.errorTitle);
      return;
    }
    try {
      setIsDeletingTracks(true);
      setDelTracksResult(null);
      const res = await deleteTrackingNotifications(ids);
      setDelTracksResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      showToast(e.message, t.errorTitle);
    } finally {
      setIsDeletingTracks(false);
    }
  }, [delTrackIds, t.enterCommaIds, t.errorTitle]);

  const handleClearTrackingNotifications = useCallback(async () => {
    try {
      setIsClearingTrack(true);
      setClearTrackResult(null);
      const res = await clearTrackingNotifications();
      setClearTrackResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      showToast(e.message, t.errorTitle);
    } finally {
      setIsClearingTrack(false);
    }
  }, [t.errorTitle]);

  const handleCountTrackingNotifications = useCallback(async () => {
    try {
      setIsCountingTrack(true);
      setCountTrackResult(null);
      const res = await countTrackingNotifications();
      setCountTrackResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      showToast(e.message, t.errorTitle);
    } finally {
      setIsCountingTrack(false);
    }
  }, [t.errorTitle]);

  const handleListRiskNotifications = useCallback(async () => {
    const size = parseInt(riskPageSize, 10);
    if (isNaN(size) || size <= 0) {
      showToast(t.validPageSize, t.errorTitle);
      return;
    }
    try {
      setIsListingRisk(true);
      setListRiskResult(null);
      const res = await listRiskNotifications(size, riskPageToken || undefined);
      setListRiskResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      showToast(e.message, t.errorTitle);
    } finally {
      setIsListingRisk(false);
    }
  }, [riskPageSize, riskPageToken, t.errorTitle, t.validPageSize]);

  const handleDeleteRiskNotification = useCallback(async () => {
    if (!delRiskId.trim()) {
      showToast(t.enterNotificationId, t.errorTitle);
      return;
    }
    try {
      setIsDeletingRisk(true);
      setDelRiskResult(null);
      const res = await deleteRiskNotification(delRiskId);
      setDelRiskResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      showToast(e.message, t.errorTitle);
    } finally {
      setIsDeletingRisk(false);
    }
  }, [delRiskId, t.enterNotificationId, t.errorTitle]);

  const handleDeleteRiskNotifications = useCallback(async () => {
    const ids = delRiskIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) {
      showToast(t.enterCommaIds, t.errorTitle);
      return;
    }
    try {
      setIsDeletingRisks(true);
      setDelRisksResult(null);
      const res = await deleteRiskNotifications(ids);
      setDelRisksResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      showToast(e.message, t.errorTitle);
    } finally {
      setIsDeletingRisks(false);
    }
  }, [delRiskIds, t.enterCommaIds, t.errorTitle]);

  const handleClearRiskNotifications = useCallback(async () => {
    try {
      setIsClearingRisk(true);
      setClearRiskResult(null);
      const res = await clearRiskNotifications();
      setClearRiskResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      showToast(e.message, t.errorTitle);
    } finally {
      setIsClearingRisk(false);
    }
  }, [t.errorTitle]);

  const handleCountRiskNotifications = useCallback(async () => {
    try {
      setIsCountingRisk(true);
      setCountRiskResult(null);
      const res = await countRiskNotifications();
      setCountRiskResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      showToast(e.message, t.errorTitle);
    } finally {
      setIsCountingRisk(false);
    }
  }, [t.errorTitle]);

  // ───────── Render helpers ─────────

  const ResultBox = ({ result }: { result: string | null }) =>
    result ? (
      <View style={styles.resultBox}>
        <Text style={styles.resultTitle}>{t.response}</Text>
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
    loading: boolean;
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
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t.title}</Text>

        {/* ── 1. Register Mobile Device ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionRegister}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.deviceTokenPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={regDeviceToken}
            onChangeText={setRegDeviceToken}
          />
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder={t.platformPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={regPlatform}
              onChangeText={setRegPlatform}
            />
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder={t.languageCodePlaceholder}
              placeholderTextColor={colors.textMuted}
              value={regLang}
              onChangeText={setRegLang}
            />
          </View>
          <ActionButton
            label={t.registerDevice}
            loading={isRegistering}
            onPress={handleRegisterDevice}
            variant="success"
          />
          <ResultBox result={registerResult} />
        </View>

        {/* ── 2. Update Mobile Device ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionUpdate}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.deviceRegistrationIdPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={updateId}
            onChangeText={setUpdateId}
          />
          <TextInput
            style={styles.input}
            placeholder={t.newDeviceTokenPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={updateDeviceToken}
            onChangeText={setUpdateDeviceToken}
          />
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder={t.platformPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={updatePlatform}
              onChangeText={setUpdatePlatform}
            />
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder={t.languageCodePlaceholder}
              placeholderTextColor={colors.textMuted}
              value={updateLang}
              onChangeText={setUpdateLang}
            />
          </View>
          <ActionButton
            label={t.updateDevice}
            loading={isUpdatingDevice}
            onPress={handleUpdateDevice}
          />
          <ResultBox result={updateDeviceResult} />
        </View>

        {/* ── 3. Unregister Mobile Device ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionUnregister}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.deviceRegistrationIdPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={unregId}
            onChangeText={setUnregId}
          />
          <ActionButton
            label={t.unregisterDevice}
            loading={isUnregistering}
            onPress={handleUnregisterDevice}
            variant="danger"
          />
          <ResultBox result={unregisterResult} />
        </View>

        {/* ── 4. List Tracking Notifications ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionListTracking}</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder={t.pageSizePlaceholder}
              placeholderTextColor={colors.textMuted}
              value={trackPageSize}
              onChangeText={setTrackPageSize}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder={t.pageTokenOptionalPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={trackPageToken}
              onChangeText={setTrackPageToken}
            />
          </View>
          <ActionButton
            label={t.listTracking}
            loading={isListingTrack}
            onPress={handleListTrackingNotifications}
          />
          <ResultBox result={listTrackResult} />
        </View>

        {/* ── 5. Delete Tracking Notification ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionDeleteTracking}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.notificationIdPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={delTrackId}
            onChangeText={setDelTrackId}
          />
          <ActionButton
            label={t.deleteOne}
            loading={isDeletingTrack}
            onPress={handleDeleteTrackingNotification}
            variant="danger"
          />
          <ResultBox result={delTrackResult} />
        </View>

        {/* ── 6. Delete Multiple Tracking Notifications ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t.sectionDeleteTrackingMultiple}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t.commaSeparatedIdsPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={delTrackIds}
            onChangeText={setDelTrackIds}
          />
          <ActionButton
            label={t.deleteMultiple}
            loading={isDeletingTracks}
            onPress={handleDeleteTrackingNotifications}
            variant="danger"
          />
          <ResultBox result={delTracksResult} />
        </View>

        {/* ── 7. Clear Tracking Notifications ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionClearTracking}</Text>
          <ActionButton
            label={t.clearAllTracking}
            loading={isClearingTrack}
            onPress={handleClearTrackingNotifications}
            variant="danger"
          />
          <ResultBox result={clearTrackResult} />
        </View>

        {/* ── 8. Count Tracking Notifications ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionCountTracking}</Text>
          <ActionButton
            label={t.countTracking}
            loading={isCountingTrack}
            onPress={handleCountTrackingNotifications}
          />
          <ResultBox result={countTrackResult} />
        </View>

        {/* ── 9. List Risk Notifications ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionListRisk}</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder={t.pageSizePlaceholder}
              placeholderTextColor={colors.textMuted}
              value={riskPageSize}
              onChangeText={setRiskPageSize}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder={t.pageTokenOptionalPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={riskPageToken}
              onChangeText={setRiskPageToken}
            />
          </View>
          <ActionButton
            label={t.listRisk}
            loading={isListingRisk}
            onPress={handleListRiskNotifications}
          />
          <ResultBox result={listRiskResult} />
        </View>

        {/* ── 10. Delete Risk Notification ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionDeleteRisk}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.notificationIdPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={delRiskId}
            onChangeText={setDelRiskId}
          />
          <ActionButton
            label={t.deleteOne}
            loading={isDeletingRisk}
            onPress={handleDeleteRiskNotification}
            variant="danger"
          />
          <ResultBox result={delRiskResult} />
        </View>

        {/* ── 11. Delete Multiple Risk Notifications ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionDeleteRiskMultiple}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.commaSeparatedIdsPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={delRiskIds}
            onChangeText={setDelRiskIds}
          />
          <ActionButton
            label={t.deleteMultiple}
            loading={isDeletingRisks}
            onPress={handleDeleteRiskNotifications}
            variant="danger"
          />
          <ResultBox result={delRisksResult} />
        </View>

        {/* ── 12. Clear Risk Notifications ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionClearRisk}</Text>
          <ActionButton
            label={t.clearAllRisk}
            loading={isClearingRisk}
            onPress={handleClearRiskNotifications}
            variant="danger"
          />
          <ResultBox result={clearRiskResult} />
        </View>

        {/* ── 13. Count Risk Notifications ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionCountRisk}</Text>
          <ActionButton
            label={t.countRisk}
            loading={isCountingRisk}
            onPress={handleCountRiskNotifications}
          />
          <ResultBox result={countRiskResult} />
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
  inputRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  inputHalf: {
    flex: 1,
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
});
