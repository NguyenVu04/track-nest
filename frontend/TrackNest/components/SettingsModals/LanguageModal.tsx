import type { AppLanguage } from "@/contexts/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  language: AppLanguage;
  onSelectLanguage: (lang: AppLanguage) => void;
  t: Record<string, string>;
};

export function LanguageModal({
  visible,
  onClose,
  language,
  onSelectLanguage,
  t,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View
          style={styles.modalContent}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.languageTitle}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
          </View>

          <Pressable
            style={[
              styles.languageOption,
              language === "English" && styles.languageOptionSelected,
            ]}
            onPress={() => onSelectLanguage("English")}
            android_ripple={{ color: "#e5e7eb" }}
          >
            <View style={styles.languageOptionContent}>
              <View>
                <Text style={styles.languageOptionTitle}>
                  {t.languageOptionEnglishTitle}
                </Text>
                <Text style={styles.languageOptionSubtitle}>
                  {t.languageOptionEnglishSubtitle}
                </Text>
              </View>
              {language === "English" && (
                <Ionicons name="checkmark-circle" size={24} color="#74becb" />
              )}
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.languageOption,
              language === "Vietnamese" && styles.languageOptionSelected,
            ]}
            onPress={() => onSelectLanguage("Vietnamese")}
            android_ripple={{ color: "#e5e7eb" }}
          >
            <View style={styles.languageOptionContent}>
              <View>
                <Text style={styles.languageOptionTitle}>
                  {t.languageOptionVietnameseTitle}
                </Text>
                <Text style={styles.languageOptionSubtitle}>
                  {t.languageOptionVietnameseSubtitle}
                </Text>
              </View>
              {language === "Vietnamese" && (
                <Ionicons name="checkmark-circle" size={24} color="#74becb" />
              )}
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  closeButton: {},
  languageOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  languageOptionSelected: {
    backgroundColor: "#f0f7ff",
  },
  languageOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  languageOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 2,
  },
  languageOptionSubtitle: {
    fontSize: 13,
    color: "#666",
  },
});
