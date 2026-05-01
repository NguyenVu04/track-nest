import { createMissing as createMissingLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { useReports } from "@/contexts/ReportsContext";
import { useAppModal } from "@/components/Modals/AppModal";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
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
import { colors, radii, spacing } from "@/styles/styles";
import { LocationPickerModal } from "@/components/Modals/LocationPickerModal";

export default function CreateMissingScreen() {
  const router = useRouter();
  const t = useTranslation(createMissingLang);
  const { modal, showAlert } = useAppModal();
  const { createMissingPersonReport } = useReports();

  const { initialName, initialLat, initialLng, initialAvatar } = useLocalSearchParams<{
    initialName?: string;
    initialLat?: string;
    initialLng?: string;
    initialAvatar?: string;
  }>();

  const [title, setTitle] = useState("");
  const [fullName, setFullName] = useState(initialName || "");
  const [personalId, setPersonalId] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(initialAvatar || null);
  const [latitude, setLatitude] = useState(initialLat ? parseFloat(initialLat) : 10.7769);
  const [longitude, setLongitude] = useState(initialLng ? parseFloat(initialLng) : 106.6424);
  const [loading, setLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showAlert(t.errorTitle, t.titleRequired, "warning");
      return;
    }
    if (!fullName.trim()) {
      showAlert(t.errorTitle, t.fullNameRequired, "warning");
      return;
    }
    if (!description.trim()) {
      showAlert(t.errorTitle, t.descriptionRequired, "warning");
      return;
    }
    if (!personalId.trim()) {
      showAlert(t.errorTitle, t.personalIdRequired, "warning");
      return;
    }
    if (!contactPhone.trim()) {
      showAlert(t.errorTitle, t.contactPhoneRequired, "warning");
      return;
    }

    setLoading(true);
    try {
      await createMissingPersonReport(
        {
          title: title.trim(),
          fullName: fullName.trim(),
          personalId: personalId.trim(),
          contactPhone: contactPhone.trim(),
          contactEmail: contactEmail.trim() || undefined,
          date,
          content: description.trim(),
          latitude,
          longitude,
        },
        photoUri ?? undefined,
      );
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
          {/* Photo picker */}
          <View style={styles.section}>
            <Text style={styles.label}>{t.photoLabel}</Text>
            <Pressable style={styles.photoPicker} onPress={handlePickPhoto}>
              {photoUri ? (
                <>
                  <Image
                    source={{ uri: photoUri }}
                    style={styles.photoPreview}
                    contentFit="cover"
                  />
                  <View style={styles.photoOverlay}>
                    <Ionicons name="camera" size={20} color="#fff" />
                    <Text style={styles.photoOverlayText}>
                      {t.photoChangeButton}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons
                    name="person-add-outline"
                    size={36}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.photoPlaceholderText}>
                    {t.photoPlaceholder}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t.titleLabel} *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={t.titlePlaceholder}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t.fullNameLabel} *</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder={t.fullNamePlaceholder}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t.personalIdLabel}</Text>
            <TextInput
              style={styles.input}
              value={personalId}
              onChangeText={setPersonalId}
              placeholder={t.personalIdPlaceholder}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t.dateLabel} *</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder={t.datePlaceholder}
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t.descriptionLabel} *</Text>
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
            <Text style={styles.label}>{t.contactPhoneLabel}</Text>
            <TextInput
              style={styles.input}
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder={t.contactPhonePlaceholder}
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t.contactEmailLabel}</Text>
            <TextInput
              style={styles.input}
              value={contactEmail}
              onChangeText={setContactEmail}
              placeholder={t.contactEmailPlaceholder}
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Location *</Text>
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
  photoPicker: {
    width: 120,
    height: 160,
    borderRadius: radii.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoPreview: { width: "100%", height: "100%" },
  photoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingVertical: 6,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  photoOverlayText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },
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
