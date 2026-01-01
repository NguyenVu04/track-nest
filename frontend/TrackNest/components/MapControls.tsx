import Fab from "@/components/Fab";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MapType } from "react-native-maps";

type Props = {
  onCenter?: (() => void) | null;
  onZoomIn?: (() => void) | null;
  onZoomOut?: (() => void) | null;
  onGeneralModalPress?: (() => void) | null;
  style?: object;
  mapType?: MapType;
  setMapType?: (t: MapType) => void;
};

export default function MapControls({
  onCenter,
  onZoomIn,
  onZoomOut,
  onGeneralModalPress,
  style,
  mapType = "standard",
  setMapType,
}: Props) {
  const MAP_TYPES: MapType[] = ["standard", "satellite", "hybrid"];
  const cycleMapType = () => {
    if (!setMapType) return;
    const idx = MAP_TYPES.indexOf(mapType as MapType);
    const next = MAP_TYPES[(idx + 1) % MAP_TYPES.length];
    setMapType(next);
  };
  const label =
    mapType === "standard" ? "S" : mapType === "satellite" ? "Sat" : "H";

  return (
    <View style={[styles.fabColumn, style]}>
      {onGeneralModalPress && <Fab icon="menu" onPress={onGeneralModalPress} />}
      {onCenter && <Fab icon="navigate-outline" onPress={onCenter} />}
      {cycleMapType && (
        <Fab onPress={cycleMapType}>
          <Text style={styles.mapTypeLabel}>{label}</Text>
        </Fab>
      )}
      {onZoomIn && <Fab icon="add" onPress={onZoomIn} />}
      {onZoomOut && <Fab icon="remove" onPress={onZoomOut} />}
    </View>
  );
}

const styles = StyleSheet.create({
  fabColumn: { position: "absolute", right: 12, bottom: 70, gap: 12 },
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
