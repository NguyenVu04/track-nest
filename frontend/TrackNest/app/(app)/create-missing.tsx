import { createMissing as createMissingLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { criminalReportsService } from "@/services/criminalReports";
import { useAppModal } from "@/components/Modals/AppModal";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

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
import { colors } from "@/styles/styles";
import { usePhotoPickerModal } from "@/components/Modals/PhotoPickerModal";
import { LocationPickerModal } from "@/components/Modals/LocationPickerModal";

export default function CreateMissingScreen() {
  const router = useRouter();
  const t = useTranslation(createMissingLang);
  const { modal, showAlert } = useAppModal();
  const { showPhotoPicker, photoPickerModal } = usePhotoPickerModal();

  const { initialName, initialLat, initialLng, initialAvatar } = useLocalSearchParams<{
    initialName?: string;
    initialLat?: string;
    initialLng?: string;
    initialAvatar?: string;
  }>();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const [title, setTitle] = useState("");
  const [fullName, setFullName] = useState(initialName || "");
  const [nickname, setNickname] = useState("");
  const [personalId, setPersonalId] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [hairColor, setHairColor] = useState("");
  const [eyeColor, setEyeColor] = useState("");
  const [distinguishingFeatures, setDistinguishingFeatures] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(initialAvatar || null);
  const [latitude, setLatitude] = useState(initialLat ? parseFloat(initialLat) : 10.7769);
  const [longitude, setLongitude] = useState(initialLng ? parseFloat(initialLng) : 106.6424);
  const [loading, setLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const handlePickPhoto = async () => {
    showPhotoPicker((uri) => setPhotoUri(uri), {
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!fullName.trim()) {
        showAlert(t.errorTitle, t.fullNameRequired, "warning");
        return;
      }
    } else if (currentStep === 2) {
      if (!title.trim()) {
        showAlert(t.errorTitle, t.titleRequired, "warning");
        return;
      }
      if (!personalId.trim()) {
        showAlert(t.errorTitle, t.personalIdRequired, "warning");
        return;
      }
      if (!description.trim()) {
        showAlert(t.errorTitle, t.descriptionRequired, "warning");
        return;
      }
    } else if (currentStep === 4) {
      if (!contactPhone.trim()) {
        showAlert(t.errorTitle, t.contactPhoneRequired, "warning");
        return;
      }
    }
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const buildHtmlContent = (): string => {
    const lines: string[] = [];
    if (nickname) lines.push(`<p><strong>Known as:</strong> ${nickname}</p>`);
    if (age) lines.push(`<p><strong>Age:</strong> ${age}</p>`);
    if (gender) lines.push(`<p><strong>Gender:</strong> ${gender}</p>`);
    if (height) lines.push(`<p><strong>Height:</strong> ${height} cm</p>`);
    if (weight) lines.push(`<p><strong>Weight:</strong> ${weight} kg</p>`);
    if (hairColor) lines.push(`<p><strong>Hair Color:</strong> ${hairColor}</p>`);
    if (eyeColor) lines.push(`<p><strong>Eye Color:</strong> ${eyeColor}</p>`);
    if (distinguishingFeatures) lines.push(`<p><strong>Distinguishing Features:</strong> ${distinguishingFeatures}</p>`);
    const physicalSection = lines.length > 0
      ? `<h3>Physical Description</h3>${lines.join("")}`
      : "";
    return `${physicalSection}<h3>Description</h3><p>${description}</p>`;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await criminalReportsService.submitUserMissingPersonReport({
        title: title.trim(),
        fullName: fullName.trim(),
        personalId: personalId.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim() || "",
        date,
        content: buildHtmlContent(),
        latitude,
        longitude,
        photo: photoUri
          ? { uri: photoUri, filename: `photo_${Date.now()}.jpg`, type: "image/jpeg" }
          : undefined,
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
      case 1:  // Basic Info
        return (
          <View style={styles.stepContent}>
            <Pressable style={styles.photoPickerWrapper} onPress={handlePickPhoto}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
              ) : (
                <>
                  <Ionicons name="person" size={48} color="#85c0c8" />
                  <Text style={styles.photoPlaceholderText}>{t.photoLabel || "Add Photo"}</Text>
                </>
              )}
            </Pressable>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.fullNameLabel}</Text>
              <TextInput
                style={styles.inputPill}
                value={fullName}
                onChangeText={setFullName}
                placeholder={t.fullNamePlaceholder}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.nicknameLabel}</Text>
              <TextInput
                style={styles.inputPill}
                value={nickname}
                onChangeText={setNickname}
                placeholder={t.nicknamePlaceholder}
                placeholderTextColor="#999"
              />
            </View>
          </View>
        );
      case 2:
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
              <Text style={styles.inputLabel}>{t.personalIdLabel}</Text>
              <TextInput
                style={styles.inputPill}
                value={personalId}
                onChangeText={setPersonalId}
                placeholder={t.personalIdPlaceholder}
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.dateLabel} *</Text>
              <TextInput
                style={styles.inputPill}
                value={date}
                onChangeText={setDate}
                placeholder={t.datePlaceholder}
                placeholderTextColor="#999"
                keyboardType="numeric"
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
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        );
      case 3:  // Physical Description
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.inputPill}
                value={age}
                onChangeText={setAge}
                placeholder="e.g. 25"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gender</Text>
              <TextInput
                style={styles.inputPill}
                value={gender}
                onChangeText={setGender}
                placeholder="e.g. Male / Female / Other"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput
                style={styles.inputPill}
                value={height}
                onChangeText={setHeight}
                placeholder="e.g. 170"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.inputPill}
                value={weight}
                onChangeText={setWeight}
                placeholder="e.g. 60"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hair Color</Text>
              <TextInput
                style={styles.inputPill}
                value={hairColor}
                onChangeText={setHairColor}
                placeholder="e.g. Black"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Eye Color</Text>
              <TextInput
                style={styles.inputPill}
                value={eyeColor}
                onChangeText={setEyeColor}
                placeholder="e.g. Brown"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Distinguishing Features</Text>
              <TextInput
                style={[styles.inputPill, styles.textArea]}
                value={distinguishingFeatures}
                onChangeText={setDistinguishingFeatures}
                placeholder="Tattoos, scars, birthmarks, etc."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        );
      case 4:  // Contact Info
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.contactPhoneLabel}</Text>
              <TextInput
                style={styles.inputPill}
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder={t.contactPhonePlaceholder}
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.contactEmailLabel}</Text>
              <TextInput
                style={styles.inputPill}
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder={t.contactEmailPlaceholder}
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
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
      case 5:  // Review
        return (
          <View style={styles.stepContent}>
            <Text style={styles.reviewTitle}>{t.reviewTitle}</Text>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>{t.fullNameLabel}:</Text> {fullName}</Text>
              {nickname ? <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>{t.nicknameLabel}:</Text> {nickname}</Text> : null}
              <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>{t.titleLabel}:</Text> {title}</Text>
              <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>{t.personalIdLabel}:</Text> {personalId}</Text>
              <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>{t.dateLabel}:</Text> {date}</Text>
              {age ? <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>Age:</Text> {age}</Text> : null}
              {gender ? <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>Gender:</Text> {gender}</Text> : null}
              {height ? <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>Height:</Text> {height} cm</Text> : null}
              {weight ? <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>Weight:</Text> {weight} kg</Text> : null}
              {hairColor ? <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>Hair:</Text> {hairColor}</Text> : null}
              {eyeColor ? <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>Eyes:</Text> {eyeColor}</Text> : null}
              <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>{t.contactPhoneLabel}:</Text> {contactPhone}</Text>
              {contactEmail ? <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>{t.contactEmailLabel}:</Text> {contactEmail}</Text> : null}
            </View>
          </View>
        );
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
          <Pressable onPress={handleBack} style={styles.headerIcon}>
            <Ionicons name={currentStep > 1 ? "arrow-back" : "close"} size={26} color="#333" />
          </Pressable>
          <Text style={styles.stepText}>
            {t.stepOf.replace("{current}", currentStep.toString()).replace("{total}", totalSteps.toString())}
          </Text>
        </View>

        <Text style={styles.pageTitle}>{t.stepByStepTitle}</Text>

        <View style={styles.stepperContainer}>
          {[1, 2, 3, 4, 5].map((step) => {
            const isActive = step === currentStep;
            const isCompleted = step < currentStep;
            const label = step === 1 ? t.stepBasicInfo
              : step === 2 ? t.stepDetails
              : step === 3 ? "Appearance"
              : step === 4 ? t.stepContact
              : t.stepReview;
            return (
              <View key={step} style={styles.stepWrapper}>
                <View style={[styles.stepBar, (isActive || isCompleted) && styles.stepBarActive]}>
                  {(isActive || isCompleted) && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={[styles.stepLabel, (isActive || isCompleted) && styles.stepLabelActive]} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {renderStepContent()}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable 
            style={styles.cancelButton} 
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>
              {t.cancelButton || "Cancel"}
            </Text>
          </Pressable>
          <Pressable 
            style={styles.nextButton} 
            onPress={currentStep < 5 ? handleNextStep : handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextButtonText}>
                {currentStep < 5 ? t.nextStep : t.submit}
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
  container: { flex: 1, backgroundColor: '#f5fafa' },
  bgBlob: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#d8ecef',
    opacity: 0.6,
  },
  bgBlob2: {
    position: 'absolute',
    bottom: 100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#e6f4f5',
    opacity: 0.5,
  },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  stepText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 20,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  stepBar: {
    height: 16,
    width: '95%',
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBarActive: {
    backgroundColor: colors.primaryLight,
  },
  stepLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  stepContent: {
    flex: 1,
  },
  photoPickerWrapper: {
    alignSelf: 'center',
    width: 140,
    height: 160,
    borderRadius: 24,
    backgroundColor: '#e8f4f6',
    borderWidth: 2,
    borderColor: '#b4dede',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3e8d98',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    marginBottom: 30,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholderText: {
    marginTop: 8,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '600',
  },
  inputPill: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#cce6e5',
    shadowColor: '#3e8d98',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  textArea: {
    minHeight: 120,
    borderRadius: 16,
    paddingTop: 16,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#cce6e5',
    shadowColor: '#3e8d98',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  locationButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 10,
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cce6e5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.primaryLight,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#cce6e5',
    shadowColor: '#3e8d98',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 12,
  },
  reviewRow: {
    fontSize: 15,
    color: '#444',
  },
  reviewLabel: {
    fontWeight: '600',
    color: '#333',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

