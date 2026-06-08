import { crimeHeatmap as crimeHeatmapLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type RiskLevel = "low" | "medium" | "high";

type RiskConfig = {
  color: string;
  bg: string;
  icon: "checkmark-circle" | "warning" | "alert-circle";
};

const RISK_CONFIG: Record<RiskLevel, RiskConfig> = {
  low:    { color: "#16a34a", bg: "rgba(220,252,231,0.95)", icon: "checkmark-circle" },
  medium: { color: "#d97706", bg: "rgba(254,243,199,0.95)", icon: "warning" },
  high:   { color: "#dc2626", bg: "rgba(254,226,226,0.95)", icon: "alert-circle" },
};

interface Props {
  visible: boolean;
  riskLevel: RiskLevel;
  crimeCount: number;
  isLoading: boolean;
  bottomOffset: number;
}

export default function HeatmapRiskBadge({
  visible,
  riskLevel,
  crimeCount,
  isLoading,
  bottomOffset,
}: Props) {
  const t = useTranslation(crimeHeatmapLang);
  const config = RISK_CONFIG[riskLevel];

  if (!visible) return null;

  const riskLabel = t[`risk${riskLevel.charAt(0).toUpperCase()}${riskLevel.slice(1)}` as keyof typeof t] as string;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, bottom: bottomOffset + 12 }]}>
      {isLoading ? (
        <>
          <ActivityIndicator size="small" color="#6b7280" />
          <Text style={styles.loadingText}>{t.loading}</Text>
        </>
      ) : (
        <>
          <Ionicons name={config.icon} size={14} color={config.color} />
          <Text style={[styles.text, { color: config.color }]}>
            {crimeCount > 0 ? `${crimeCount} ${t.incidents}` : t.noIncidents}
          </Text>
          <View style={[styles.divider, { backgroundColor: config.color }]} />
          <Text style={[styles.riskText, { color: config.color }]}>{riskLabel}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
  riskText: {
    fontSize: 12,
    fontWeight: "500",
  },
  loadingText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  divider: {
    width: 1,
    height: 12,
    opacity: 0.4,
  },
});
