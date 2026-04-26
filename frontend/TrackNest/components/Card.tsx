import { radii, shadows } from "@/styles/styles";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function Card({ children, style }: CardProps) {
  return <View style={[localStyles.card, style]}>{children}</View>;
}

const localStyles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 10,
    ...shadows.small,
  },
});
