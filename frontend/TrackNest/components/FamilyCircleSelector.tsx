import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FamilyCircle } from "@/constant/types";

interface FamilyCircleSelectorProps {
  selectedCircle: FamilyCircle | null;
  onPress: () => void;
}

export const FamilyCircleSelector: React.FC<FamilyCircleSelectorProps> = ({
  selectedCircle,
  onPress,
}) => {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name="people-circle-outline" size={24} color="#74becb" />
      </View>
      <Text style={styles.text} numberOfLines={1}>
        {selectedCircle?.name ?? "Select Circle"}
      </Text>
      <Ionicons name="chevron-down" size={18} color="#666" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    maxWidth: 200,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e0f2f5",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
});
