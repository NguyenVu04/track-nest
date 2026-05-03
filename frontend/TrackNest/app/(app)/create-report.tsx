import { useAppModal } from "@/components/Modals/AppModal";
import { LocationPickerModal } from "@/components/Modals/LocationPickerModal";
import { createReport as createReportLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { createCrimeReport } from "@/utils/crimeHelpers";
import { colors } from "@/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

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
import { usePhotoPickerModal } from "@/components/Modals/PhotoPickerModal";

const MAX_IMAGES = 5;

export default function CreateReportScreen() {
  const router = useRouter();
  const t = useTranslation(createReportLang);
  const { modal, showAlert } = useAppModal();
  const { showPhotoPicker, photoPickerModal } = usePhotoPickerModal();
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

    showPhotoPicker((uri) => {
      setPhotoUris((prev) => [...prev, uri]);
    }, {
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8,
    });
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
      {photoPickerModal}
      <View style={styles.bgBlob} />
      <View style={styles.bgBlob2} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerIcon}>
            <Ionicons name="close" size={26} color="#333" />
          </Pressable>
        </View>

        <Text style={styles.pageTitle}>{t.pageTitle}</Text>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.titleLabel}</Text>
            <TextInput
              style={styles.inputPill}
              value={title}
              onChangeText={setTitle}
              placeholder={t.titlePlaceholder}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.descriptionLabel}</Text>
            <TextInput
              style={[styles.inputPill, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder={t.descriptionPlaceholder}
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.severityLabel}</Text>
            <View style={styles.severityContainer}>
              {(["Low", "Medium", "High"] as const).map((sev, idx) => {
                const isActive = severity === sev;
                return (
                  <Pressable
                    key={sev}
                    style={[
                      styles.severityBtn,
                      idx === 0 && styles.severityBtnLeft,
                      idx === 2 && styles.severityBtnRight,
                      isActive && styles.severityBtnActive,
                      isActive &&
                        (sev === "High"
                          ? styles.sevHighActive
                          : sev === "Medium"
                            ? styles.sevMedActive
                            : styles.sevLowActive),
                      !isActive &&
                        (sev === "High"
                          ? styles.sevHighInactive
                          : sev === "Medium"
                            ? styles.sevMedInactive
                            : styles.sevLowInactive),
                    ]}
                    onPress={() => setSeverity(sev)}
                  >
                    <Text
                      style={[
                        styles.severityText,
                        isActive && styles.severityTextActive,
                      ]}
                    >
                      {sev}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t.imagesLabel} ({photoUris.length}/{MAX_IMAGES})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imageRow}
            >
              {photoUris.length < MAX_IMAGES && (
                <Pressable style={styles.addImageBtn} onPress={handleAddPhoto}>
                  <Ionicons name="camera" size={28} color="#60869a" />
                  <Text style={styles.addImageText}>{t.addImage}</Text>
                </Pressable>
              )}
              {photoUris.map((uri, index) => (
                <View key={uri} style={styles.thumbWrapper}>
                  <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
                  <Pressable
                    style={styles.thumbRemove}
                    onPress={() => handleRemovePhoto(index)}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={24} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Pressable
              style={styles.locationButton}
              onPress={() => setShowLocationPicker(true)}
            >
              <View style={styles.locationIconBox}>
                <Ionicons name="location" size={20} color="#5e8293" />
              </View>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationTitle}>{t.locationLabel || "Location"}</Text>
                <Text style={styles.locationCoords}>
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </Pressable>
          </View>
          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.cancelButton} onPress={() => router.back()} disabled={loading}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.nextButton} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextButtonText}>{t.submit}</Text>
            )}
          </Pressable>
        </View>

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

const THUMB_SIZE = 100;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5fafa" },
  bgBlob: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#e0f2f1",
    top: -100,
    right: -100,
    opacity: 0.6,
  },
  bgBlob2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#e0f2f1",
    bottom: 100,
    left: -50,
    opacity: 0.4,
  },
  keyboardView: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#2d3748",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 10,
  },
  inputPill: {
    backgroundColor: "#f2f6f9",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#333",
    borderWidth: 1,
    borderColor: "#dce4e8",
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
  },
  severityContainer: {
    flexDirection: "row",
    height: 48,
  },
  severityBtn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dce4e8",
    backgroundColor: "#f2f6f9",
  },
  severityBtnLeft: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderRightWidth: 0,
  },
  severityBtnRight: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderLeftWidth: 0,
  },
  severityBtnActive: {
    borderWidth: 2,
    zIndex: 1,
    elevation: 3,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sevHighActive: { backgroundColor: "#ffe5e5", borderColor: "#ff4d4f", shadowColor: "#ff4d4f" },
  sevMedActive: { backgroundColor: "#fff5d6", borderColor: "#f39c12", shadowColor: "#f39c12" },
  sevLowActive: { backgroundColor: "#eefcf1", borderColor: "#27ae60", shadowColor: "#27ae60" },
  sevHighInactive: { backgroundColor: "#fff0f0" },
  sevMedInactive: { backgroundColor: "#f2f6f9" }, // Match default for medium when inactive
  sevLowInactive: { backgroundColor: "#f4fbf5" },
  severityText: { fontSize: 15, fontWeight: "500", color: "#555" },
  severityTextActive: { fontWeight: "700", color: "#222" },
  imageRow: { flexDirection: "row", gap: 12 },
  addImageBtn: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 16,
    backgroundColor: "#f2f6f9",
    borderWidth: 2,
    borderColor: "#b4dede",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  addImageText: { fontSize: 13, color: "#60869a", fontWeight: "500" },
  thumbWrapper: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  thumb: { width: "100%", height: "100%" },
  thumbRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#dce4e8",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  locationIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#e6eef2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  locationCoords: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#f2f6f9",
    alignItems: "center",
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4a5568",
  },
  nextButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
