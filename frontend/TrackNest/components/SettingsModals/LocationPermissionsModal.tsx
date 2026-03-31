import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  fgLocationStatus: string;
  bgLocationStatus: string;
  onRequestForegroundPermission: () => Promise<void>;
  onRequestBackgroundPermission: () => Promise<void>;
  onOpenSystemSettings: () => void;
  t: Record<string, string>;
};

export function LocationPermissionsModal({
  visible,
  onClose,
  fgLocationStatus,
  bgLocationStatus,
  onRequestForegroundPermission,
  onRequestBackgroundPermission,
  onOpenSystemSettings,
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
            <Text style={styles.modalTitle}>{t.locationTitle}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
          </View>
          <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
            <Text style={styles.devSectionLabel}>
              {t.permissionStatusLabel}
            </Text>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>
                {t.foregroundLocationLabel}
              </Text>
              <View
                style={[
                  styles.permissionBadge,
                  {
                    backgroundColor:
                      fgLocationStatus === "granted"
                        ? "#d1fae5"
                        : fgLocationStatus === "denied"
                          ? "#fde8e8"
                          : "#fef3c7",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.permissionBadgeText,
                    {
                      color:
                        fgLocationStatus === "granted"
                          ? "#065f46"
                          : fgLocationStatus === "denied"
                            ? "#b91c1c"
                            : "#92400e",
                    },
                  ]}
                >
                  {fgLocationStatus === "granted"
                    ? t.permissionGranted
                    : fgLocationStatus === "denied"
                      ? t.permissionDenied
                      : t.permissionNotSet}
                </Text>
              </View>
            </View>
            <View style={[styles.permissionRow, { marginTop: 10 }]}>
              <Text style={styles.permissionLabel}>
                {t.backgroundLocationLabel}
              </Text>
              <View
                style={[
                  styles.permissionBadge,
                  {
                    backgroundColor:
                      bgLocationStatus === "granted"
                        ? "#d1fae5"
                        : bgLocationStatus === "denied"
                          ? "#fde8e8"
                          : bgLocationStatus === "unavailable"
                            ? "#f3f4f6"
                            : "#fef3c7",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.permissionBadgeText,
                    {
                      color:
                        bgLocationStatus === "granted"
                          ? "#065f46"
                          : bgLocationStatus === "denied"
                            ? "#b91c1c"
                            : "#6b7280",
                    },
                  ]}
                >
                  {bgLocationStatus === "granted"
                    ? t.permissionGranted
                    : bgLocationStatus === "denied"
                      ? t.permissionDenied
                      : bgLocationStatus === "unavailable"
                        ? t.permissionNA
                        : t.permissionNotSet}
                </Text>
              </View>
            </View>
            <View style={styles.devDivider} />
            <Text style={{ color: "#666", fontSize: 13, marginBottom: 16 }}>
              {t.locationInfo}
            </Text>
            {fgLocationStatus !== "granted" && (
              <Pressable
                style={[styles.saveButton, { marginBottom: 12 }]}
                onPress={onRequestForegroundPermission}
                android_ripple={{ color: "#5da8b5" }}
              >
                <Text style={styles.saveButtonText}>
                  {t.requestForegroundPermissionButton}
                </Text>
              </Pressable>
            )}
            {fgLocationStatus === "granted" &&
              bgLocationStatus !== "granted" &&
              bgLocationStatus !== "unavailable" && (
                <Pressable
                  style={[styles.saveButton, { marginBottom: 12 }]}
                  onPress={onRequestBackgroundPermission}
                  android_ripple={{ color: "#5da8b5" }}
                >
                  <Text style={styles.saveButtonText}>
                    {t.requestBackgroundPermissionButton}
                  </Text>
                </Pressable>
              )}
            <Pressable
              style={[styles.saveButton, { backgroundColor: "#f3f4f6" }]}
              onPress={onOpenSystemSettings}
              android_ripple={{ color: "#e5e7eb" }}
            >
              <Text style={[styles.saveButtonText, { color: "#374151" }]}>
                {t.openSystemSettingsButton}
              </Text>
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
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  permissionLabel: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  permissionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  permissionBadgeText: {
    fontSize: 12,
    fontWeight: "600",
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
