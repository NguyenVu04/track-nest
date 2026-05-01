import { Ionicons } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  serverUrlInput: string;
  onChangeServerUrlInput: (value: string) => void;
  emergencyUrlInput: string;
  onChangeEmergencyUrlInput: (value: string) => void;
  criminalUrlInput: string;
  onChangeCriminalUrlInput: (value: string) => void;
  grpcUrlInput?: string;
  onChangeGrpcUrlInput?: (value: string) => void;
  pendingDevMode: boolean;
  onChangePendingDevMode: (value: boolean) => void;
  onSave: () => void;
  t: Record<string, string>;
};

export function DeveloperOptionsModal({
  visible,
  onClose,
  serverUrlInput,
  onChangeServerUrlInput,
  emergencyUrlInput,
  onChangeEmergencyUrlInput,
  criminalUrlInput,
  onChangeCriminalUrlInput,
  grpcUrlInput,
  onChangeGrpcUrlInput,
  pendingDevMode,
  onChangePendingDevMode,
  onSave,
  t,
}: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const modalMaxWidth = Math.min(440, screenWidth - 32);
  const modalMaxHeight = screenHeight * 0.88;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <View
            style={[
              styles.sheet,
              { maxWidth: modalMaxWidth, maxHeight: modalMaxHeight },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Fixed header */}
            <View style={styles.header}>
              <Text style={styles.title}>{t.developerOptionsTitle}</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>

            {/* Scrollable body */}
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <UrlField
                label={t.serverUrlLabel}
                description={t.serverUrlDescription}
                value={serverUrlInput}
                onChange={onChangeServerUrlInput}
                placeholder={t.serverUrlPlaceholder}
              />

              <UrlField
                label={t.emergencyUrlLabel ?? "Emergency URL"}
                description={t.emergencyUrlDescription ?? t.serverUrlDescription}
                value={emergencyUrlInput}
                onChange={onChangeEmergencyUrlInput}
                placeholder={t.serverUrlPlaceholder}
              />

              <UrlField
                label={t.criminalUrlLabel ?? "Criminal URL"}
                description={t.criminalUrlDescription ?? t.serverUrlDescription}
                value={criminalUrlInput}
                onChange={onChangeCriminalUrlInput}
                placeholder={t.serverUrlPlaceholder}
              />

              {grpcUrlInput !== undefined && onChangeGrpcUrlInput && (
                <UrlField
                  label={t.grpcUrlLabel ?? "gRPC URL"}
                  description={
                    t.grpcUrlDescription ??
                    "Full gRPC endpoint. Leave blank to derive from the base URL."
                  }
                  value={grpcUrlInput}
                  onChange={onChangeGrpcUrlInput}
                  placeholder="e.g. https://api.example.com:443"
                />
              )}

              <View style={styles.divider} />

              <Text style={styles.label}>{t.devModeLabel}</Text>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>
                    {pendingDevMode ? t.enabled : t.disabled}
                  </Text>
                  <Text style={styles.toggleDesc}>{t.devModeDescription}</Text>
                </View>
                <Switch
                  value={pendingDevMode}
                  onValueChange={onChangePendingDevMode}
                  trackColor={{ false: "#d1d5db", true: "#74becb" }}
                  thumbColor="#fff"
                />
              </View>

              <Pressable
                style={styles.saveBtn}
                onPress={onSave}
                android_ripple={{ color: "#5da8b5" }}
              >
                <Text style={styles.saveBtnText}>{t.saveButton}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function UrlField({
  label,
  description,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      {description ? (
        <Text style={styles.fieldDesc}>{description}</Text>
      ) : null}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
    </>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  sheet: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
    marginRight: 8,
  },
  body: {
    flexShrink: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldDesc: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    lineHeight: 16,
  },
  input: {
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
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 16,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    marginTop: 4,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  toggleDesc: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: "#74becb",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 20,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
