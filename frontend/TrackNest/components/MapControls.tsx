import Fab from "@/components/Fab";
import SosFab from "@/components/SosFab";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MapType } from "react-native-maps";

type Props = {
  onCenter?: (() => void) | null;
  onZoomIn?: (() => void) | null;
  onZoomOut?: (() => void) | null;
  onGeneralModalPress?: (() => void) | null;
  onMapTypePress?: (() => void) | null;
  onToggleHeatmap?: (() => void) | null;
  onTogglePOIs?: (() => void) | null;
  style?: object;
  mapType?: MapType;
  showHeatmap?: boolean;
  showPOIs?: boolean;
};

export default function MapControls({
  onCenter,
  onZoomIn,
  onZoomOut,
  onGeneralModalPress,
  onMapTypePress,
  onToggleHeatmap,
  onTogglePOIs,
  style,
  mapType = "standard",
  showHeatmap = false,
  showPOIs = true,
}: Props) {
  const labelByType: Partial<Record<MapType, string>> = {
    standard: "S",
    satellite: "Sa",
    hybrid: "H",
    terrain: "T",
    satelliteFlyover: "SF",
    hybridFlyover: "HF",
  };
  const label = labelByType[mapType] ?? "S";

  return (
    <View style={[styles.fabColumn, style]}>
      {onGeneralModalPress && <Fab icon="menu" onPress={onGeneralModalPress} />}
      {onToggleHeatmap && (
        <Fab 
          icon={showHeatmap ? "flame" : "flame-outline"} 
          onPress={onToggleHeatmap}
          color={showHeatmap ? "#e74c3c" : "#757575"}
        />
      )}
      {onTogglePOIs && (
        <Fab 
          icon={showPOIs ? "business" : "business-outline"} 
          onPress={onTogglePOIs}
          color={showPOIs ? "#74becb" : "#757575"}
        />
      )}
      {onCenter && <Fab icon="navigate-outline" onPress={onCenter} />}
      {onMapTypePress && (
        <Fab onPress={onMapTypePress}>
          <Text style={styles.mapTypeLabel}>{label}</Text>
        </Fab>
      )}
      <SosFab />
      {onZoomIn && <Fab icon="add" onPress={onZoomIn} />}
      {onZoomOut && <Fab icon="remove" onPress={onZoomOut} />}
    </View>
  );
}

const styles = StyleSheet.create({
  fabColumn: { position: "absolute", right: 12, bottom: 70, gap: 12, flexDirection: "column", alignItems: "flex-end" },
  mapTypeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  mapTypeLabel: { fontSize: 12, fontWeight: "600", color: "#333" },
});
