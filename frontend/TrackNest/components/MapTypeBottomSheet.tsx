import { MapTypeBottomSheet as mapTypeBottomSheetLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MapType } from "react-native-maps";

type MapTypeOption = {
  type: MapType;
  labelKey: "standard" | "hybrid";
  descriptionKey: "standardDescription" | "hybridDescription";
  previewColors: {
    background: string;
    roads: string;
  };
};

const MAP_TYPE_OPTIONS: MapTypeOption[] = [
  {
    type: "standard",
    labelKey: "standard",
    descriptionKey: "standardDescription",
    previewColors: {
      background: "#E8E4D8",
      roads: "#FFFFFF",
    },
  },
  {
    type: "hybrid",
    labelKey: "hybrid",
    descriptionKey: "hybridDescription",
    previewColors: {
      background: "#3D5A3D",
      roads: "#FFD700",
    },
  },
];

type Props = {
  currentMapType: MapType;
  onSelectMapType: (type: MapType) => void;
};

// Simple map preview component
const MapPreview = ({
  colors,
  isHybrid,
}: {
  colors: MapTypeOption["previewColors"];
  isHybrid: boolean;
}) => (
  <View style={[styles.mapPreview, { backgroundColor: colors.background }]}>
    {/* Simulated roads */}
    <View
      style={[
        styles.previewRoadH,
        { backgroundColor: colors.roads, top: "30%" },
      ]}
    />
    <View
      style={[
        styles.previewRoadH,
        { backgroundColor: colors.roads, top: "70%" },
      ]}
    />
    <View
      style={[
        styles.previewRoadV,
        { backgroundColor: colors.roads, left: "25%" },
      ]}
    />
    <View
      style={[
        styles.previewRoadV,
        { backgroundColor: colors.roads, left: "75%" },
      ]}
    />
    {/* Simulated labels/markers */}
    <View style={[styles.previewMarker, { top: "20%", left: "40%" }]}>
      <Ionicons name="location" size={16} color="#e74c3c" />
    </View>
    <View style={[styles.previewMarker, { top: "50%", left: "60%" }]}>
      <Ionicons name="location" size={16} color="#74becb" />
    </View>
    {isHybrid && (
      <>
        {/* Satellite texture simulation */}
        <View style={styles.satelliteTexture1} />
        <View style={styles.satelliteTexture2} />
      </>
    )}
  </View>
);

export const MapTypeBottomSheet = ({
  currentMapType,
  onSelectMapType,
}: Props) => {
  const t = useTranslation(mapTypeBottomSheetLang);

  return (
    <BottomSheetView style={styles.container}>
      <Text style={styles.title}>{t.title}</Text>
      <View style={styles.optionsContainer}>
        {MAP_TYPE_OPTIONS.map((option) => {
          const isSelected = currentMapType === option.type;
          return (
            <Pressable
              key={option.type}
              style={[
                styles.optionCard,
                isSelected && styles.optionCardSelected,
              ]}
              onPress={() => onSelectMapType(option.type)}
            >
              <MapPreview
                colors={option.previewColors}
                isHybrid={option.type === "hybrid"}
              />
              <Text
                style={[
                  styles.optionLabel,
                  isSelected && styles.optionLabelSelected,
                ]}
              >
                {t[option.labelKey]}
              </Text>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </BottomSheetView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  optionCard: {
    alignItems: "center",
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: "#f5f5f5",
  },
  optionCardSelected: {
    borderColor: "#74becb",
    backgroundColor: "#E8F2FF",
  },
  mapPreview: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
    overflow: "hidden",
    position: "relative",
  },
  previewRoadH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.8,
  },
  previewRoadV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 3,
    opacity: 0.8,
  },
  previewMarker: {
    position: "absolute",
  },
  satelliteTexture1: {
    position: "absolute",
    top: "10%",
    left: "5%",
    width: "30%",
    height: "25%",
    backgroundColor: "#2D4A2D",
    borderRadius: 4,
    opacity: 0.6,
  },
  satelliteTexture2: {
    position: "absolute",
    bottom: "15%",
    right: "10%",
    width: "25%",
    height: "20%",
    backgroundColor: "#4A6A4A",
    borderRadius: 4,
    opacity: 0.5,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  optionLabelSelected: {
    color: "#5aa8b5",
    fontWeight: "600",
  },
  checkmark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#74becb",
    alignItems: "center",
    justifyContent: "center",
  },
});
