import { FamilyCircle } from "@/constant/types";
import { usePOIAnalytics } from "@/contexts/POIAnalyticsContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FamilyCircleSelector } from "./FamilyCircleSelector";

type Props = {
  selectedCircle: FamilyCircle | null;
  handleFamilyCircleModalPress: () => void;
};

export default function MapHeader({
  selectedCircle,
  handleFamilyCircleModalPress,
}: Props) {
  const { riskLevel, crimeCount, isHighRiskZone } = usePOIAnalytics();

  return (
    <>
      <View style={styles.header}>
        {/* Risk badge (left) — hidden when low risk */}
        {riskLevel !== "low" && (
          <View style={styles.headerSide}>
            <View
              style={[
                styles.riskBadge,
                riskLevel === "high"
                  ? styles.riskBadgeHigh
                  : styles.riskBadgeMedium,
              ]}
            >
              <Ionicons
                name={riskLevel === "high" ? "warning" : "alert-circle-outline"}
                size={13}
                color="#fff"
              />
              <Text style={styles.riskText}>
                {riskLevel === "high" ? "High Risk" : "Medium Risk"}
              </Text>
            </View>
          </View>
        )}

        {/* Centered Family Circle pill */}
        <FamilyCircleSelector
          selectedCircle={selectedCircle}
          onPress={handleFamilyCircleModalPress}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    gap: 8,
  },
  headerSide: {
    width: 48,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerSideRight: {
    alignItems: "flex-end",
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  riskBadgeHigh: {
    backgroundColor: "#e74c3c",
  },
  riskBadgeMedium: {
    backgroundColor: "#f39c12",
  },
  riskText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
});
