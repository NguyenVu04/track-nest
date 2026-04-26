import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  serverUrlInput: string;
  onChangeServerUrlInput: (value: string) => void;
  pendingDevMode: boolean;
  onChangePendingDevMode: (value: boolean) => void;
  onSave: () => void;
  defaultServiceUrl: string;
  t: Record<string, string>;
};

export function DeveloperOptionsModal({
  visible,
  onClose,
  serverUrlInput,
  onChangeServerUrlInput,
  pendingDevMode,
  onChangePendingDevMode,
  onSave,
  defaultServiceUrl,
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
            <Text style={styles.modalTitle}>{t.developerOptionsTitle}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
            <Text style={styles.devSectionLabel}>{t.serverUrlLabel}</Text>
            <Text style={{ color: "#666", marginBottom: 8, fontSize: 13 }}>
              {t.serverUrlDescription}
            </Text>
            <TextInput
              style={styles.urlInput}
              value={serverUrlInput}
              onChangeText={onChangeServerUrlInput}
              placeholder={defaultServiceUrl || t.serverUrlPlaceholder}
              placeholderTextColor="#aaa"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <View style={styles.devDivider} />

            <Text style={styles.devSectionLabel}>{t.devModeLabel}</Text>
            <View style={styles.devModeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.devModeRowTitle}>
                  {pendingDevMode ? t.enabled : t.disabled}
                </Text>
                <Text style={{ color: "#666", fontSize: 12, marginTop: 2 }}>
                  {t.devModeDescription}
                </Text>
              </View>
              <Switch
                value={pendingDevMode}
                onValueChange={onChangePendingDevMode}
                trackColor={{ false: "#d1d5db", true: "#74becb" }}
                thumbColor="#fff"
              />
            </View>

            <Pressable
              style={[styles.saveButton, { marginTop: 20 }]}
              onPress={onSave}
              android_ripple={{ color: "#5da8b5" }}
            >
              <Text style={styles.saveButtonText}>{t.saveButton}</Text>
            </Pressable>
          </View>
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
  devSectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#f9fafb",
    marginBottom: 16,
  },
  devDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 16,
  },
  devModeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  devModeRowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  saveButton: {
    backgroundColor: "#74becb",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
