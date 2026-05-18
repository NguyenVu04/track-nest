import { colors } from "@/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ViewStyle } from "react-native";
import { Button } from "tamagui";

type FabProps = {
  size?: "small" | "large";
  icon?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  color?: string;
};

export default function Fab({
  size = "small",
  icon,
  children,
  onPress,
  style,
  color,
}: FabProps) {
  const isLarge = size === "large";
  const iconColor = color || (isLarge ? "#fff" : "#333");
  const dimension = isLarge ? 72 : 44;

  return (
    <Button
      onPress={onPress}
      width={dimension}
      height={dimension}
      borderRadius={dimension / 2}
      backgroundColor={isLarge ? colors.danger : "#fff"}
      alignItems="center"
      justifyContent="center"
      shadowColor="#000"
      shadowOpacity={isLarge ? 0.12 : 0.08}
      shadowRadius={isLarge ? 6 : 4}
      elevation={isLarge ? 4 : 2}
      pressStyle={{ opacity: 0.8 }}
      style={style}
      padding={0}
    >
      {children ?? (
        <Ionicons
          name={icon as any}
          size={isLarge ? 28 : 20}
          color={iconColor}
        />
      )}
    </Button>
  );
}
