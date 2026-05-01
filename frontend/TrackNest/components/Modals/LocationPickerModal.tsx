import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { colors, radii, spacing } from "@/styles/styles";

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number) => void;
  initialLatitude?: number;
  initialLongitude?: number;
}

export function LocationPickerModal({
  visible,
  onClose,
  onSelectLocation,
  initialLatitude = 10.7769,
  initialLongitude = 106.6424,
}: LocationPickerModalProps) {
  const [region, setRegion] = useState<Region>({
    latitude: initialLatitude,
    longitude: initialLongitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const handleConfirm = () => {
    onSelectLocation(region.latitude, region.longitude);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Select Location</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={region}
            onRegionChangeComplete={setRegion}
            showsUserLocation
          />
          {/* Center Marker */}
          <View style={styles.centerMarkerContainer} pointerEvents="none">
            <Ionicons name="location" size={40} color={colors.danger} style={styles.centerMarker} />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.coordinates}>
            {region.latitude.toFixed(6)}, {region.longitude.toFixed(6)}
          </Text>
          <Pressable style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmText}>Confirm Location</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  closeButton: { padding: spacing.xs },
  headerTitle: { fontSize: 18, fontWeight: "600", color: colors.textPrimary },
  mapContainer: { flex: 1, position: "relative" },
  map: { flex: 1 },
  centerMarkerContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -20,
    marginTop: -40,
    alignItems: "center",
    justifyContent: "center",
  },
  centerMarker: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  coordinates: {
    textAlign: "center",
    color: colors.textSecondary,
    marginBottom: spacing.md,
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
  },
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
