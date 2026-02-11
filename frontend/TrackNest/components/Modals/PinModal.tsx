import { Modal, Pressable, StyleSheet, Text } from "react-native";

import { map as mapLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { PinInput } from "@pakenfit/react-native-pin-input";

type PinModalProps = {
  showPinModal: boolean;
  handleCancelPin: () => void;
  pendingAction: string;
  handlePinSubmit: (pin: string) => void;
};

export const PinModal = ({
  showPinModal,
  handleCancelPin,
  pendingAction,
  handlePinSubmit,
}: PinModalProps) => {
  const t = useTranslation(mapLang);

  return (
    <Modal
      visible={showPinModal}
      onRequestClose={handleCancelPin}
      animationType="fade"
      transparent
    >
      <Pressable style={styles.overlay} onPress={handleCancelPin}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{t.pinTitle}</Text>
          <Text style={styles.subtitle}>
            {t.pinSubTitle} {pendingAction}
          </Text>

          <PinInput length={4} autoFocus onFillEnded={handlePinSubmit} />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "relative",
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",

    // shadow iOS
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },

    // shadow Android
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
});
