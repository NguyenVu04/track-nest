import { familyCircleNew as familyCircleNewLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { createFamilyCircle } from "@/services/trackingManager";
import { showToast } from "@/utils";
import { colors, shadows } from "@/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
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

type RoleOption = {
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
};

const ROLE_OPTIONS: RoleOption[] = [
  { value: "Parent",      icon: "person",                        labelKey: "roleParent"      },
  { value: "Child",       icon: "happy-outline",                 labelKey: "roleChild"       },
  { value: "Guardian",    icon: "shield-outline",                labelKey: "roleGuardian"    },
  { value: "Grandparent", icon: "walk-outline",                  labelKey: "roleGrandparent" },
  { value: "Spouse",      icon: "heart-outline",                 labelKey: "roleSpouse"      },
  { value: "Other",       icon: "ellipsis-horizontal-outline",   labelKey: "roleOther"       },
];

const TOTAL_STEPS = 2;

export default function NewFamilyCircle() {
  const t = useTranslation(familyCircleNewLang);
  const router = useRouter();

  const [step, setStep]       = useState(1);
  const [name, setName]       = useState("");
  const [role, setRole]       = useState("Parent");
  const [creating, setCreating] = useState(false);

  const goBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const goNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        showToast(t.validationEnterName, t.validationTitle);
        return;
      }
      setStep(2);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      showToast(t.validationEnterName, t.validationTitle);
      return;
    }
    setCreating(true);
    try {
      await createFamilyCircle(name.trim(), role);
      setName("");
      router.back();
    } catch (error: any) {
      showToast(error?.message ?? t.createFailed, t.errorTitle);
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background blobs */}
      <View style={styles.bgBlob} />
      <View style={styles.bgBlob2} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={24}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable onPress={goBack} style={styles.headerIconBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>

          <Text style={styles.headerTitle}>{t.pageTitle}</Text>

          <View style={styles.headerIconBtn} />
        </View>

        {/* ── Step progress ── */}
        <View style={styles.progressRow}>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(step / TOTAL_STEPS) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {`Step ${step} of ${TOTAL_STEPS}`}
          </Text>
          <Text style={styles.progressStepName}>
            {step === 1 ? "Details" : "Role"}
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 ? (
            /* ═══════════ STEP 1 — Circle name ═══════════ */
            <>
              <Text style={styles.stepHeading}>Create a New Circle</Text>
              <Text style={styles.stepSubtitle}>
                Set up a private space to coordinate, share updates, and stay connected with your family.
              </Text>

              <View style={styles.card}>
                <TextInput
                  style={styles.nameInput}
                  placeholder={t.namePlaceholder}
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  editable={!creating}
                  returnKeyType="next"
                  onSubmitEditing={goNext}
                />
              </View>
            </>
          ) : (
            /* ═══════════ STEP 2 — Role picker ═══════════ */
            <>
              <Text style={styles.stepHeading}>Select Your Role</Text>
              <Text style={styles.stepSubtitle}>
                This helps personalise your experience.
              </Text>

              <View style={styles.roleGrid}>
                {ROLE_OPTIONS.map((option) => {
                  const selected = role === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={[styles.roleCard, selected && styles.roleCardSelected]}
                      onPress={() => setRole(option.value)}
                      disabled={creating}
                    >
                      <View style={[styles.roleIconWrap, selected && styles.roleIconWrapSelected]}>
                        <Ionicons
                          name={option.icon}
                          size={28}
                          color={selected ? colors.primary : colors.textSecondary}
                        />
                      </View>
                      <Text style={[styles.roleCardLabel, selected && styles.roleCardLabelSelected]}>
                        {(t as Record<string, string>)[option.labelKey]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>

        {/* ── Footer action button ── */}
        <View style={styles.footer}>
          {step === 1 ? (
            <Pressable
              style={[styles.actionBtn, !name.trim() && styles.actionBtnDisabled]}
              onPress={goNext}
              disabled={!name.trim() || creating}
            >
              <Text style={styles.actionBtnText}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
          ) : (
            <Pressable
              style={[styles.actionBtn, creating && styles.actionBtnDisabled]}
              onPress={handleCreate}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.actionBtnText}>{t.create}</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
  },

  /* ── Background blobs ── */
  bgBlob: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.primaryMuted,
    opacity: 0.55,
  },
  bgBlob2: {
    position: "absolute",
    bottom: 80,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#e6f4f5",
    opacity: 0.45,
  },

  keyboardView: { flex: 1 },

  /* ── Header ── */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.2,
  },

  /* ── Progress bar ── */
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
  },
  progressBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  progressStepName: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "700",
  },

  /* ── Scroll area ── */
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },

  /* ── Step headings ── */
  stepHeading: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  stepSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 28,
  },

  /* ── Step 1 — name card ── */
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 6,
    ...shadows.small,
  },
  nameInput: {
    fontSize: 16,
    color: colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },

  /* ── Step 2 — role grid ── */
  roleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  roleCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 10,
    borderWidth: 2,
    borderColor: "transparent",
    ...shadows.small,
  },
  roleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  roleIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.bgSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  roleIconWrapSelected: {
    backgroundColor: "#c6e8ec",
  },
  roleCardLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  roleCardLabelSelected: {
    color: colors.primaryDark,
    fontWeight: "700",
  },

  /* ── Footer ── */
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  actionBtn: {
    backgroundColor: colors.primaryDark,
    borderRadius: 30,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  actionBtnDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
