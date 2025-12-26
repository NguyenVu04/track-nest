import { colors, shadows } from "@/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";

type FabProps = {
  size?: "small" | "large";
  icon?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
};

export default function Fab({
  size = "small",
  icon,
  children,
  onPress,
  style,
}: FabProps) {
  const isLarge = size === "large";
  return (
    <Pressable
      onPress={onPress}
      style={[isLarge ? localStyles.big : localStyles.small, style]}
    >
      {children ? (
        children
      ) : (
        <Ionicons
          name={icon as any}
          size={isLarge ? 28 : 20}
          color={isLarge ? "#fff" : "#333"}
        />
      )}
    </Pressable>
  );
}

const localStyles = StyleSheet.create({
  small: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    ...shadows.small,
  },
  big: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.medium,
  },
});
