import React from "react";
import { ViewStyle } from "react-native";
import { YStack } from "tamagui";

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function Card({ children, style }: CardProps) {
  return (
    <YStack
      backgroundColor="$bg"
      borderRadius="$md"
      padding="$md"
      marginBottom={10}
      shadowColor="#000"
      shadowOpacity={0.08}
      shadowRadius={4}
      elevation={2}
      style={style}
    >
      {children}
    </YStack>
  );
}
