import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

export function usePhotoPickerModal() {
  const [visible, setVisible] = useState(false);
  const [onSelectCb, setOnSelectCb] = useState<((uri: string) => void) | null>(null);
  const [pickerOptions, setPickerOptions] = useState<ImagePicker.ImagePickerOptions>({
    mediaTypes: ["images"],
    quality: 0.8,
  });

  const showPhotoPicker = (onSelect: (uri: string) => void, options?: ImagePicker.ImagePickerOptions) => {
    setOnSelectCb(() => onSelect);
    if (options) {
      setPickerOptions(options);
    }
    setVisible(true);
  };

  const handleClose = () => {
    setVisible(false);
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      handleClose();
      return;
    }
    handleClose();
    setTimeout(async () => {
      const result = await ImagePicker.launchCameraAsync(pickerOptions);
      if (!result.canceled && result.assets.length > 0 && onSelectCb) {
        onSelectCb(result.assets[0].uri);
      }
    }, 300);
  };

  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      handleClose();
      return;
    }
    handleClose();
    setTimeout(async () => {
      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      if (!result.canceled && result.assets.length > 0 && onSelectCb) {
        onSelectCb(result.assets[0].uri);
      }
    }, 300);
  };

  const photoPickerModal = (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Photo</Text>
            <Text style={styles.subtitle}>Choose a photo source</Text>
          </View>
          <View style={styles.options}>
            <Pressable style={styles.optionBtn} onPress={handleCamera}>
              <View style={[styles.iconBox, { backgroundColor: "#eefcf1" }]}>
                <Ionicons name="camera" size={24} color="#27ae60" />
              </View>
              <Text style={styles.optionText}>Take from Camera</Text>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </Pressable>
            <Pressable style={styles.optionBtn} onPress={handleGallery}>
              <View style={[styles.iconBox, { backgroundColor: "#eef6fa" }]}>
                <Ionicons name="image" size={24} color="#2980b9" />
              </View>
              <Text style={styles.optionText}>Choose from Gallery</Text>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </Pressable>
          </View>
          <Pressable style={styles.cancelBtn} onPress={handleClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );

  return { showPhotoPicker, photoPickerModal };
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
    borderRadius: 20,
    width: "100%",
    maxWidth: 340,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  options: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 12,
  },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
  cancelBtn: {
    padding: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    marginTop: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#94a3b8",
  },
});
