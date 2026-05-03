import { map as mapLang } from "@/constant/languages";
import { FamilyCircle } from "@/constant/types";
import { useTranslation } from "@/hooks/useTranslation";
import { colors } from "@/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

interface FamilyCircleSelectorProps {
  selectedCircle: FamilyCircle | null;
  onPress: () => void;
}

export const FamilyCircleSelector: React.FC<FamilyCircleSelectorProps> = ({
  selectedCircle,
  onPress,
}) => {
  const t = useTranslation(mapLang);
  return (
    <Pressable style={styles.pill} onPress={onPress}>
      <Ionicons name="home" size={16} color="#0c6874" />
      <Text style={styles.text} numberOfLines={1}>
        {selectedCircle?.name ?? t.familyCircleDefault}
      </Text>
      <Ionicons name="chevron-down" size={16} color="#0c6874" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    maxWidth: 200,
  },
  text: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0c6874",
    flexShrink: 1,
  },
});
