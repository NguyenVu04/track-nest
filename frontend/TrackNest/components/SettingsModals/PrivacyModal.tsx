import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onClearLocationHistory: () => void;
  onClearLocalCache: () => void;
  t: Record<string, string>;
};

export function PrivacyModal({
  visible,
  onClose,
  onClearLocationHistory,
  onClearLocalCache,
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
            <Text style={styles.modalTitle}>{t.privacyTitle}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
          </View>
          <ScrollView style={{ paddingHorizontal: 20 }}>
            <Text style={[styles.devSectionLabel, { marginBottom: 12 }]}>
              {t.dataCollectionTitle}
            </Text>
            <View style={styles.privacyRow}>
              <Ionicons
                name="location"
                size={16}
                color="#74becb"
                style={{ marginTop: 2 }}
              />
              <Text style={styles.privacyRowText}>
                <Text style={{ fontWeight: "600" }}>
                  {t.privacyLocationLabel}{" "}
                </Text>
                {t.privacyLocationDescription}
              </Text>
            </View>
            <View style={styles.privacyRow}>
              <Ionicons
                name="notifications"
                size={16}
                color="#74becb"
                style={{ marginTop: 2 }}
              />
              <Text style={styles.privacyRowText}>
                <Text style={{ fontWeight: "600" }}>
                  {t.privacyNotificationsLabel}{" "}
                </Text>
                {t.privacyNotificationsDescription}
              </Text>
            </View>
            <View style={styles.privacyRow}>
              <Ionicons
                name="key"
                size={16}
                color="#74becb"
                style={{ marginTop: 2 }}
              />
              <Text style={styles.privacyRowText}>
                <Text style={{ fontWeight: "600" }}>
                  {t.privacyAuthenticationLabel}{" "}
                </Text>
                {t.privacyAuthenticationDescription}
              </Text>
            </View>
            <View style={[styles.devDivider, { marginHorizontal: 0 }]} />
            <Text style={[styles.devSectionLabel, { marginBottom: 12 }]}>
              {t.localDataTitle}
            </Text>
            <Pressable
              style={[
                styles.saveButton,
                { backgroundColor: "#fff4e5", marginBottom: 10 },
              ]}
              onPress={onClearLocationHistory}
              android_ripple={{ color: "#ffe8c7" }}
            >
              <Text style={[styles.saveButtonText, { color: "#d97706" }]}>
                {t.clearLocationHistoryButton}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.saveButton,
                { backgroundColor: "#fdeaea", marginBottom: 20 },
              ]}
              onPress={onClearLocalCache}
              android_ripple={{ color: "#fbd5d5" }}
            >
              <Text style={[styles.saveButtonText, { color: "#e74c3c" }]}>
                {t.clearLocalCacheButton}
              </Text>
            </Pressable>
          </ScrollView>
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
  privacyRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  privacyRowText: {
    flex: 1,
    fontSize: 13,
    color: "#555",
    lineHeight: 19,
  },
  devDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 16,
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
