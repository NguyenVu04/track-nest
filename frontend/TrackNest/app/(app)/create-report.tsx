import { createReport as createReportLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { createCrimeReport } from "@/services/criminalReports";
import { useAppModal } from "@/components/Modals/AppModal";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, spacing } from "@/styles/styles";

export default function CreateReportScreen() {
  const router = useRouter();
  const t = useTranslation(createReportLang);
  const { modal, showAlert } = useAppModal();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"Low" | "Medium" | "High">("Medium");
  const [latitude, setLatitude] = useState("10.7769");
  const [longitude, setLongitude] = useState("106.6424");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      showAlert("Error", "Please enter a title", "warning");
      return;
    }
    if (!description.trim()) {
      showAlert("Error", "Please enter a description", "warning");
      return;
    }

    setLoading(true);
    try {
      await createCrimeReport({
        title: title.trim(),
        description: description.trim(),
        severity,
        latitude: parseFloat(latitude) || 10.7769,
        longitude: parseFloat(longitude) || 106.6424,
        images: [],
      });
      showAlert("Success", "Report submitted successfully", "success", "OK", () => router.back());
    } catch (err: any) {
      showAlert("Error", err.message || "Failed to submit report", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {modal}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#333" />
          </Pressable>
          <Text style={styles.headerTitle}>{t.pageTitle}</Text>
          <Pressable onPress={handleSubmit} disabled={loading}>
            <Text style={[styles.submitText, loading && styles.disabledText]}>
              {loading ? "..." : t.submit}
            </Text>
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.label}>{t.titleLabel}</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={t.titlePlaceholder}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t.descriptionLabel}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder={t.descriptionPlaceholder}
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t.severityLabel}</Text>
            <View style={styles.severityRow}>
              {(["Low", "Medium", "High"] as const).map((sev) => (
                <Pressable
                  key={sev}
                  style={[
                    styles.severityBtn,
                    severity === sev && styles.severityBtnActive,
                    severity === sev &&
                      (sev === "High"
                        ? styles.sevHighActive
                        : sev === "Medium"
                          ? styles.sevMedActive
                          : styles.sevLowActive),
                  ]}
                  onPress={() => setSeverity(sev)}
                >
                  <Text
                    style={[
                      styles.severityText,
                      severity === sev && styles.severityTextActive,
                    ]}
                  >
                    {sev}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t.locationLabel}</Text>
            <View style={styles.locationRow}>
              <View style={styles.locationInput}>
                <Text style={styles.locationLabel}>Lat</Text>
                <TextInput
                  style={styles.input}
                  value={latitude}
                  onChangeText={setLatitude}
                  keyboardType="numeric"
                  placeholder="10.7769"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.locationInput}>
                <Text style={styles.locationLabel}>Lng</Text>
                <TextInput
                  style={styles.input}
                  value={longitude}
                  onChangeText={setLongitude}
                  keyboardType="numeric"
                  placeholder="106.6424"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  keyboardView: { flex: 1 },
  header: {
    height: 56,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: colors.textPrimary },
  submitText: { fontSize: 16, fontWeight: "600", color: colors.primary },
  disabledText: { opacity: 0.5 },
  content: { flex: 1, padding: spacing.md },
  section: { marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: "600", color: colors.textPrimary, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: { minHeight: 100 },
  severityRow: { flexDirection: "row", gap: spacing.sm },
  severityBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  severityBtnActive: { borderWidth: 2 },
  sevHighActive: { backgroundColor: "#ffd6d6", borderColor: "#ff4d4f" },
  sevMedActive: { backgroundColor: "#fff0d6", borderColor: "#f39c12" },
  sevLowActive: { backgroundColor: "#f2fff0", borderColor: "#27ae60" },
  severityText: { fontWeight: "600", color: colors.textSecondary },
  severityTextActive: { color: colors.textPrimary },
  locationRow: { flexDirection: "row", gap: spacing.md },
  locationInput: { flex: 1 },
  locationLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
});
