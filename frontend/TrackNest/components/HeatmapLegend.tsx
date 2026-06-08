import { crimeHeatmap as crimeHeatmapLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

/** Matches the heatmap gradient used in the MapView Heatmap component. */
const GRADIENT_SEGMENTS = ["#27ae60", "#f1c40f", "#e67e22", "#e74c3c"] as const;

interface Props {
  visible: boolean;
  bottomOffset: number;
}

export default function HeatmapLegend({ visible, bottomOffset }: Props) {
  const t = useTranslation(crimeHeatmapLang);

  if (!visible) return null;

  return (
    <View style={[styles.container, { bottom: bottomOffset + 54 }]}>
      <Text style={styles.label}>{t.legendSafe}</Text>
      <View style={styles.bar}>
        {GRADIENT_SEGMENTS.map((color) => (
          <View key={color} style={[styles.segment, { backgroundColor: color }]} />
        ))}
      </View>
      <Text style={styles.label}>{t.legendDangerous}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  bar: {
    flexDirection: "row",
    borderRadius: 4,
    overflow: "hidden",
  },
  segment: {
    width: 18,
    height: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
    color: "#374151",
  },
});
