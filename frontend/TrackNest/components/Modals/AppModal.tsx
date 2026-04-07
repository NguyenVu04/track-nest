import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

export type AppModalVariant = "info" | "success" | "error" | "warning";

interface AppModalButton {
  text: string;
  onPress: () => void;
  style?: "primary" | "cancel" | "destructive";
}

interface AppModalProps {
  visible: boolean;
  title: string;
  message?: string;
  variant?: AppModalVariant;
  buttons: AppModalButton[];
  onRequestClose?: () => void;
}

const VARIANT_CONFIG: Record<
  AppModalVariant,
  { accent: string; iconName: keyof typeof Ionicons.glyphMap; iconColor: string }
> = {
  info:    { accent: "#74becb", iconName: "information-circle-outline", iconColor: "#74becb" },
  success: { accent: "#27ae60", iconName: "checkmark-circle-outline",   iconColor: "#27ae60" },
  error:   { accent: "#e74c3c", iconName: "alert-circle-outline",       iconColor: "#e74c3c" },
  warning: { accent: "#f39c12", iconName: "warning-outline",            iconColor: "#f39c12" },
};

export function AppModal({
  visible,
  title,
  message,
  variant = "info",
  buttons,
  onRequestClose,
}: AppModalProps) {
  const cfg = VARIANT_CONFIG[variant];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose ?? buttons[0]?.onPress}
    >
      <Pressable style={styles.overlay} onPress={onRequestClose ?? buttons[0]?.onPress}>
        <Pressable style={styles.card} onPress={() => {}}>
          {/* Accent bar */}
          <View style={[styles.accentBar, { backgroundColor: cfg.accent }]} />

          <View style={styles.body}>
            <Ionicons name={cfg.iconName} size={36} color={cfg.iconColor} style={styles.icon} />
            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
          </View>

          <View style={styles.buttonRow}>
            {buttons.map((btn, i) => (
              <Pressable
                key={i}
                style={[
                  styles.button,
                  btn.style === "cancel"      && styles.cancelButton,
                  btn.style === "destructive" && styles.destructiveButton,
                  btn.style === "primary"     && { backgroundColor: cfg.accent },
                  !btn.style                  && { backgroundColor: cfg.accent },
                  i > 0 && styles.buttonNotFirst,
                ]}
                onPress={btn.onPress}
                android_ripple={{ color: "rgba(0,0,0,0.1)" }}
              >
                <Text
                  style={[
                    styles.buttonText,
                    (btn.style === "cancel") && styles.cancelButtonText,
                    (btn.style === "destructive") && styles.destructiveButtonText,
                  ]}
                >
                  {btn.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Convenience hook to manage a simple alert/confirm modal state
export function useAppModal() {
  const [state, setState] = React.useState<{
    visible: boolean;
    title: string;
    message?: string;
    variant?: AppModalVariant;
    buttons: AppModalButton[];
  }>({ visible: false, title: "", buttons: [] });

  const showAlert = (
    title: string,
    message?: string,
    variant: AppModalVariant = "info",
    okText = "OK",
    onOk?: () => void,
  ) => {
    setState({
      visible: true,
      title,
      message,
      variant,
      buttons: [
        {
          text: okText,
          style: "primary",
          onPress: () => {
            setState((s) => ({ ...s, visible: false }));
            onOk?.();
          },
        },
      ],
    });
  };

  const showConfirm = (
    title: string,
    message: string | undefined,
    onConfirm: () => void,
    variant: AppModalVariant = "warning",
    confirmText = "Confirm",
    cancelText = "Cancel",
  ) => {
    setState({
      visible: true,
      title,
      message,
      variant,
      buttons: [
        {
          text: cancelText,
          style: "cancel",
          onPress: () => setState((s) => ({ ...s, visible: false })),
        },
        {
          text: confirmText,
          style: "primary",
          onPress: () => {
            setState((s) => ({ ...s, visible: false }));
            onConfirm();
          },
        },
      ],
    });
  };

  const modal = (
    <AppModal
      visible={state.visible}
      title={state.title}
      message={state.message}
      variant={state.variant}
      buttons={state.buttons}
      onRequestClose={() => setState((s) => ({ ...s, visible: false }))}
    />
  );

  return { modal, showAlert, showConfirm };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 360,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  accentBar: {
    height: 4,
    width: "100%",
  },
  body: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  icon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonNotFirst: {
    borderLeftWidth: 1,
    borderLeftColor: "#f1f5f9",
  },
  cancelButton: {
    backgroundColor: "#f8fafc",
  },
  destructiveButton: {
    backgroundColor: "#fef2f2",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  cancelButtonText: {
    color: "#64748b",
  },
  destructiveButtonText: {
    color: "#e74c3c",
  },
});
