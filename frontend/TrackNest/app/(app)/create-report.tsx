import { useAppModal } from "@/components/Modals/AppModal";
import { LocationPickerModal } from "@/components/Modals/LocationPickerModal";
import { createReport as createReportLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { criminalReportsService } from "@/services/criminalReports";
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
const TOTAL_STEPS = 4;
const THUMB_SIZE = 100;

export default function CreateReportScreen() {
  const router = useRouter();
  const t = useTranslation(createReportLang);
  const { modal, showAlert } = useAppModal();
  const { showPhotoPicker, photoPickerModal } = usePhotoPickerModal();

  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"Low" | "Medium" | "High">("Medium");
  const [latitude, setLatitude] = useState(10.7769);
  const [longitude, setLongitude] = useState(106.6424);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [numberOfVictims, setNumberOfVictims] = useState(0);
  const [numberOfOffenders, setNumberOfOffenders] = useState(0);
  const [arrested, setArrested] = useState(false);

  const severityDisplayLabel: Record<"Low" | "Medium" | "High", string> = {
    Low: t.severityLow,
    Medium: t.severityMedium,
    High: t.severityHigh,
  };

  const handleAddPhoto = () => {
    if (photoUris.length >= MAX_IMAGES) return;
    showPhotoPicker((uri) => setPhotoUris((prev) => [...prev, uri]), {
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8,
    });
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!title.trim()) {
        showAlert(t.errorTitle, t.titleRequired, "warning");
        return;
      }
      if (!description.trim()) {
        showAlert(t.errorTitle, t.descriptionRequired, "warning");
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handleSubmit = async () => {
    const severityMap: Record<"Low" | "Medium" | "High", number> = {
      Low: 1,
      Medium: 3,
      High: 5,
    };
    setLoading(true);
    try {
      await criminalReportsService.submitUserCrimeReport({
        title: title.trim(),
        content: description.trim(),
        severity: severityMap[severity],
        date: new Date().toISOString().split("T")[0],
        latitude,
        longitude,
        numberOfVictims,
        numberOfOffenders,
        arrested,
        photos: photoUris.map((uri) => ({ uri })),
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.titleLabel} *</Text>
              <TextInput
                style={styles.inputPill}
                value={title}
                onChangeText={setTitle}
                placeholder={t.titlePlaceholder}
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.descriptionLabel} *</Text>
              <TextInput
                style={[styles.inputPill, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder={t.descriptionPlaceholder}
                placeholderTextColor="#999"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.severityLabel}</Text>
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
                        {severityDisplayLabel[sev]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.numberOfVictimsLabel}</Text>
              <View style={styles.counterRow}>
                <Pressable
                  onPress={() =>
                    setNumberOfVictims(Math.max(0, numberOfVictims - 1))
                  }
                >
                  <Ionicons
                    name="remove-circle-outline"
                    size={28}
                    color={colors.primary}
                  />
                </Pressable>
                <Text style={styles.counterValue}>{numberOfVictims}</Text>
                <Pressable
                  onPress={() => setNumberOfVictims(numberOfVictims + 1)}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={28}
                    color={colors.primary}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.numberOfOffendersLabel}</Text>
              <View style={styles.counterRow}>
                <Pressable
                  onPress={() =>
                    setNumberOfOffenders(Math.max(0, numberOfOffenders - 1))
                  }
                >
                  <Ionicons
                    name="remove-circle-outline"
                    size={28}
                    color={colors.primary}
                  />
                </Pressable>
                <Text style={styles.counterValue}>{numberOfOffenders}</Text>
                <Pressable
                  onPress={() => setNumberOfOffenders(numberOfOffenders + 1)}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={28}
                    color={colors.primary}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.arrestedLabel}</Text>
              <Pressable
                style={[styles.toggleBtn, arrested && styles.toggleBtnActive]}
                onPress={() => setArrested(!arrested)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    arrested && styles.toggleTextActive,
                  ]}
                >
                  {arrested ? t.yes : t.no}
                </Text>
              </Pressable>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
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
                    <Image
                      source={{ uri }}
                      style={styles.thumb}
                      contentFit="cover"
                    />
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
              <Text style={styles.inputLabel}>{t.locationLabel}</Text>
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
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.reviewTitle}>{t.reviewTitle}</Text>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>{t.titleLabel}: </Text>
                {title}
              </Text>
              <Text style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>{t.descriptionLabel}: </Text>
                {description.length > 80
                  ? `${description.substring(0, 80)}…`
                  : description}
              </Text>
              <Text style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>{t.severityLabel}: </Text>
                {severityDisplayLabel[severity]}
              </Text>
              <Text style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>
                  {t.numberOfVictimsLabel}:{" "}
                </Text>
                {numberOfVictims}
              </Text>
              <Text style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>
                  {t.numberOfOffendersLabel}:{" "}
                </Text>
                {numberOfOffenders}
              </Text>
              <Text style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>{t.arrestedLabel}: </Text>
                {arrested ? t.yes : t.no}
              </Text>
              <Text style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>{t.imagesLabel}: </Text>
                {t.reviewPhotos.replace("{count}", photoUris.length.toString())}
              </Text>
              <Text style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>{t.locationLabel}: </Text>
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        );
    }
  };

  const stepLabels = [
    t.stepBasicInfo,
    t.stepDetails,
    t.stepEvidence,
    t.stepReview,
  ];

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
          <Pressable onPress={handleBack} style={styles.headerIcon}>
            <Ionicons
              name={currentStep > 1 ? "arrow-back" : "close"}
              size={26}
              color="#333"
            />
          </Pressable>
          <Text style={styles.stepText}>
            {t.stepOf
              .replace("{current}", currentStep.toString())
              .replace("{total}", TOTAL_STEPS.toString())}
          </Text>
        </View>

        <Text style={styles.pageTitle}>{t.stepByStepTitle}</Text>

        <View style={styles.stepperContainer}>
          {stepLabels.map((label, i) => {
            const step = i + 1;
            const isActive = step === currentStep;
            const isCompleted = step < currentStep;
            return (
              <View key={step} style={styles.stepWrapper}>
                <View
                  style={[
                    styles.stepBar,
                    (isActive || isCompleted) && styles.stepBarActive,
                  ]}
                >
                  {(isActive || isCompleted) && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    (isActive || isCompleted) && styles.stepLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderStepContent()}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>{t.cancelButton}</Text>
          </Pressable>
          <Pressable
            style={styles.nextButton}
            onPress={currentStep < TOTAL_STEPS ? handleNextStep : handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextButtonText}>
                {currentStep < TOTAL_STEPS ? t.nextStep : t.submit}
              </Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5fafa" },
  bgBlob: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#d8ecef",
    opacity: 0.6,
  },
  bgBlob2: {
    position: "absolute",
    bottom: 100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#e6f4f5",
    opacity: 0.5,
  },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  stepText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 20,
  },
  stepperContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  stepWrapper: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  stepBar: {
    height: 16,
    width: "95%",
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  stepBarActive: {
    backgroundColor: colors.primaryLight,
  },
  stepLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
  },
  stepLabelActive: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  content: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  stepContent: { flex: 1 },
  inputGroup: { marginBottom: 20 },
  inputLabel: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    fontWeight: "600",
  },
  inputPill: {
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#cce6e5",
    shadowColor: "#3e8d98",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  textArea: {
    minHeight: 140,
    borderRadius: 16,
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
  sevHighActive: {
    backgroundColor: "#ffe5e5",
    borderColor: "#ff4d4f",
    shadowColor: "#ff4d4f",
  },
  sevMedActive: {
    backgroundColor: "#fff5d6",
    borderColor: "#f39c12",
    shadowColor: "#f39c12",
  },
  sevLowActive: {
    backgroundColor: "#eefcf1",
    borderColor: "#27ae60",
    shadowColor: "#27ae60",
  },
  sevHighInactive: { backgroundColor: "#fff0f0" },
  sevMedInactive: { backgroundColor: "#f2f6f9" },
  sevLowInactive: { backgroundColor: "#f4fbf5" },
  severityText: { fontSize: 15, fontWeight: "500", color: "#555" },
  severityTextActive: { fontWeight: "700", color: "#222" },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 8,
  },
  counterValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    minWidth: 32,
    textAlign: "center",
  },
  toggleBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#f2f6f9",
    borderWidth: 1,
    borderColor: "#dce4e8",
    alignSelf: "flex-start",
  },
  toggleBtnActive: {
    backgroundColor: "#eefcf1",
    borderColor: "#27ae60",
  },
  toggleText: { fontSize: 15, fontWeight: "600", color: "#555" },
  toggleTextActive: { color: "#27ae60" },
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
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#cce6e5",
    shadowColor: "#3e8d98",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 8,
  },
  locationButtonText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 10,
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cce6e5",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "bold",
  },
  nextButton: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: colors.primaryLight,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#cce6e5",
    shadowColor: "#3e8d98",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 12,
  },
  reviewRow: {
    fontSize: 15,
    color: "#444",
  },
  reviewLabel: {
    fontWeight: "600",
    color: "#333",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
});
