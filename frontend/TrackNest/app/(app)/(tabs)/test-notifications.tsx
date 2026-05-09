import { testNotifications as lang } from "@/constant/languages";
import {
  sendTestEmergencyRequestNotification,
  sendTestFamilyMessageNotification,
} from "@/services/testNotificationsService";
import { colors, spacing } from "@/styles/styles";
import { showToast } from "@/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useCallback, useState } from "react";
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

// ── Small reusable components ────────────────────────────────────────────────

function ActionButton({
  label,
  loading,
  onPress,
  variant = "primary",
}: {
  label: string;
  loading?: boolean;
  onPress: () => void;
  variant?: "primary" | "success" | "danger";
}) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === "success" && styles.buttonSuccess,
        variant === "danger" && styles.buttonDanger,
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
}

function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

function ResultBox({ result }: { result: string | null }) {
  const t = useTranslation(lang);
  if (!result) return null;
  return (
    <View style={styles.resultBox}>
      <Text style={styles.resultTitle}>{t.result}</Text>
      <Text style={styles.resultText} selectable>
        {result}
      </Text>
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function TestNotificationsScreen() {
  const t = useTranslation(lang);

  // ── Emergency form state ──
  const [serviceId, setServiceId] = useState("");
  const [requestId, setRequestId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [targetUsername, setTargetUsername] = useState("");
  const [serviceUsername, setServiceUsername] = useState("");
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [emergencyResult, setEmergencyResult] = useState<string | null>(null);

  // ── Family message form state ──
  const [circleId, setCircleId] = useState("");
  const [senderId, setSenderId] = useState("");
  const [senderName, setSenderName] = useState("");
  const [content, setContent] = useState("");
  const [familyLoading, setFamilyLoading] = useState(false);
  const [familyResult, setFamilyResult] = useState<string | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSendEmergency = useCallback(async () => {
    if (!serviceId.trim() || !targetId.trim() || !targetUsername.trim() || !serviceUsername.trim()) {
      showToast(t.missingFields, t.errorTitle);
      return;
    }
    setEmergencyLoading(true);
    setEmergencyResult(null);
    try {
      const res = await sendTestEmergencyRequestNotification({
        serviceId: serviceId.trim(),
        requestId: requestId.trim() || crypto.randomUUID(),
        targetId: targetId.trim(),
        targetUsername: targetUsername.trim(),
        serviceUsername: serviceUsername.trim(),
      });
      setEmergencyResult(JSON.stringify(res, null, 2));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast(msg, t.errorTitle);
      setEmergencyResult(`Error: ${msg}`);
    } finally {
      setEmergencyLoading(false);
    }
  }, [serviceId, requestId, targetId, targetUsername, serviceUsername, t]);

  const handleSendFamily = useCallback(async () => {
    if (!circleId.trim() || !senderId.trim() || !senderName.trim() || !content.trim()) {
      showToast(t.missingFields, t.errorTitle);
      return;
    }
    setFamilyLoading(true);
    setFamilyResult(null);
    try {
      const res = await sendTestFamilyMessageNotification({
        circleId: circleId.trim(),
        senderId: senderId.trim(),
        senderName: senderName.trim(),
        content: content.trim(),
      });
      setFamilyResult(JSON.stringify(res, null, 2));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast(msg, t.errorTitle);
      setFamilyResult(`Error: ${msg}`);
    } finally {
      setFamilyLoading(false);
    }
  }, [circleId, senderId, senderName, content, t]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{t.title}</Text>

        {/* ── Section 1: Emergency Request Notification ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionEmergency}</Text>
          <Text style={styles.hint}>{t.emergencyHint}</Text>

          <LabeledInput
            label={t.labelServiceId}
            value={serviceId}
            onChangeText={setServiceId}
            placeholder={t.placeholderUuid}
          />
          <LabeledInput
            label={t.labelRequestId}
            value={requestId}
            onChangeText={setRequestId}
            placeholder={t.placeholderUuid}
          />
          <LabeledInput
            label={t.labelTargetId}
            value={targetId}
            onChangeText={setTargetId}
            placeholder={t.placeholderUuid}
          />
          <LabeledInput
            label={t.labelTargetUsername}
            value={targetUsername}
            onChangeText={setTargetUsername}
            placeholder="alice"
          />
          <LabeledInput
            label={t.labelServiceUsername}
            value={serviceUsername}
            onChangeText={setServiceUsername}
            placeholder="fire_station_1"
          />

          <ActionButton
            label={t.sendEmergency}
            loading={emergencyLoading}
            onPress={handleSendEmergency}
            variant="danger"
          />
          <ResultBox result={emergencyResult} />
        </View>

        {/* ── Section 2: Family Message Notification ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.sectionFamily}</Text>
          <Text style={styles.hint}>{t.familyHint}</Text>

          <LabeledInput
            label={t.labelCircleId}
            value={circleId}
            onChangeText={setCircleId}
            placeholder={t.placeholderUuid}
          />
          <LabeledInput
            label={t.labelSenderId}
            value={senderId}
            onChangeText={setSenderId}
            placeholder={t.placeholderUuid}
          />
          <LabeledInput
            label={t.labelSenderName}
            value={senderName}
            onChangeText={setSenderName}
            placeholder="Bob"
          />
          <LabeledInput
            label={t.labelContent}
            value={content}
            onChangeText={setContent}
            placeholder={t.placeholderContent}
            multiline
          />

          <ActionButton
            label={t.sendFamily}
            loading={familyLoading}
            onPress={handleSendFamily}
            variant="success"
          />
          <ResultBox result={familyResult} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

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
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: "monospace",
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: spacing.sm,
    fontFamily: undefined,
    fontSize: 15,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    marginTop: spacing.sm,
  },
  buttonSuccess: {
    backgroundColor: colors.success,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
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
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  resultText: {
    fontSize: 12,
    fontFamily: "monospace",
    color: colors.textPrimary,
    lineHeight: 18,
  },
});
