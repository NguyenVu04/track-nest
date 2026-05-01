import { useAppModal } from "@/components/Modals/AppModal";
import { LocationPickerModal } from "@/components/Modals/LocationPickerModal";
import { createReport as createReportLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { createCrimeReport } from "@/utils/crimeHelpers";
import { colors, radii, spacing } from "@/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

const MAX_IMAGES = 5;

export default function CreateReportScreen() {
  const router = useRouter();
  const t = useTranslation(createReportLang);
  const { modal, showAlert } = useAppModal();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"Low" | "Medium" | "High">("Medium");
  const [latitude, setLatitude] = useState(10.7769);
  const [longitude, setLongitude] = useState(106.6424);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const handleAddPhoto = async () => {
    if (photoUris.length >= MAX_IMAGES) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotoUris((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showAlert(t.errorTitle, t.titleRequired, "warning");
      return;
    }
    if (!description.trim()) {
      showAlert(t.errorTitle, t.descriptionRequired, "warning");
      return;
    }

    setLoading(true);
    try {
      console.log("Create report with: ", {
        title: title.trim(),
        description: description.trim(),
        severity,
        latitude,
        longitude,
        images: photoUris,
      });

      await createCrimeReport({
        title: title.trim(),
        description: description.trim(),
        severity,
        latitude,
        longitude,
        images: photoUris,
      });
      showAlert(t.successTitle, t.submitSuccess, "success", t.okButton, () =>
        router.back(),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.submitError;
      showAlert(t.errorTitle, msg, "error");
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

          {/* Image picker */}
          <View style={styles.section}>
            <Text style={styles.label}>
              {t.imagesLabel}{" "}
              <Text style={styles.labelHint}>
                ({photoUris.length}/{MAX_IMAGES})
              </Text>
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imageRow}
            >
              {photoUris.map((uri, index) => (
                <View key={uri} style={styles.thumbWrapper}>
                  <Image
                    source={{ uri }}
                    style={styles.thumb}
                    contentFit="cover"
                  />
                  <Pressable
                    style={styles.thumbRemove}
                    onPress={() => handleRemovePhoto(index)}
                    hitSlop={6}
                  >
                    <Ionicons name="close-circle" size={20} color="#fff" />
                  </Pressable>
                </View>
              ))}
              {photoUris.length < MAX_IMAGES && (
                <Pressable style={styles.addImageBtn} onPress={handleAddPhoto}>
                  <Ionicons
                    name="camera-outline"
                    size={24}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.addImageText}>{t.addImage}</Text>
                </Pressable>
              )}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t.locationLabel}</Text>
            <Pressable
              style={styles.locationButton}
              onPress={() => setShowLocationPicker(true)}
            >
              <Ionicons name="map-outline" size={20} color={colors.primary} />
              <Text style={styles.locationButtonText}>
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </Pressable>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        <LocationPickerModal
          visible={showLocationPicker}
          onClose={() => setShowLocationPicker(false)}
          onSelectLocation={(lat, lng) => {
            setLatitude(lat);
            setLongitude(lng);
          }}
          initialLatitude={latitude}
          initialLongitude={longitude}
        />

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const THUMB_SIZE = 88;

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
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  labelHint: { fontWeight: "400", color: colors.textSecondary },
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
  imageRow: { flexDirection: "row", gap: spacing.sm, paddingVertical: 4 },
  thumbWrapper: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radii.md,
    overflow: "hidden",
    position: "relative",
  },
  thumb: { width: "100%", height: "100%" },
  thumbRemove: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
  },
  addImageBtn: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addImageText: { fontSize: 11, color: colors.textSecondary },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  locationButtonText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
});
