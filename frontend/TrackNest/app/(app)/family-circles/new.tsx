import { familyCircleNew as familyCircleNewLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { createFamilyCircle } from "@/services/trackingManager";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewFamilyCircle() {
  const t = useTranslation(familyCircleNewLang);

  const ROLE_OPTIONS = [
    { value: "Parent", label: t.roleParent },
    { value: "Child", label: t.roleChild },
    { value: "Guardian", label: t.roleGuardian },
    { value: "Grandparent", label: t.roleGrandparent },
    { value: "Spouse", label: t.roleSpouse },
    { value: "Other", label: t.roleOther },
  ];

  const [name, setName] = useState("");
  const [role, setRole] = useState("Parent");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert(t.validationTitle, t.validationEnterName);
      return;
    }
    setCreating(true);
    try {
      await createFamilyCircle(name.trim(), role);
      setName("");
      router.back();
    } catch (error: any) {
      Alert.alert(t.errorTitle, error?.message ?? t.createFailed);
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={18} />
        <Text style={{ fontSize: 18 }}>{t.back}</Text>
      </Pressable>

      <Text style={styles.title}>{t.pageTitle}</Text>

      <TextInput
        style={styles.input}
        placeholder={t.namePlaceholder}
        placeholderTextColor="#aaa"
        value={name}
        onChangeText={setName}
        editable={!creating}
      />

      <View style={styles.roleSection}>
        <Text style={styles.roleLabel}>{t.yourRole}</Text>
        <View style={styles.roleGrid}>
          {ROLE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.roleChip,
                role === option.value && styles.roleChipSelected,
              ]}
              onPress={() => setRole(option.value)}
              disabled={creating}
            >
              <Text
                style={[
                  styles.roleChipText,
                  role === option.value && styles.roleChipTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        style={[
          styles.createButton,
          (creating || !name.trim()) && styles.createButtonDisabled,
        ]}
        onPress={handleCreate}
        disabled={creating || !name.trim()}
      >
        {creating && <ActivityIndicator size="small" color="#fff" />}
        <Text style={styles.createButtonText}>
          {creating ? t.creating : t.create}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    top: 24,
    left: 16,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 24,
  },
  input: {
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    fontSize: 16,
  },
  roleSection: {
    width: "100%",
    maxWidth: 400,
    marginBottom: 24,
  },
  roleLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  roleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  roleChip: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#ccc",
    backgroundColor: "#f9fafb",
  },
  roleChipSelected: {
    borderColor: "#74becb",
    backgroundColor: "#e0f2f5",
  },
  roleChipText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  roleChipTextSelected: {
    color: "#3a8fa0",
    fontWeight: "700",
  },
  createButton: {
    backgroundColor: "#74becb",
    paddingVertical: 13,
    paddingHorizontal: 40,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    maxWidth: 400,
    justifyContent: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#ccc",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
