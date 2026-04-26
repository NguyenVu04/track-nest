import { StyleSheet } from "react-native";

export const colors = {
  // Primary palette based on #74becb
  primary: "#74becb",
  primaryDark: "#5aa8b5",
  primaryLight: "#a8d8e0",
  primaryMuted: "#e0f2f5",

  // Secondary/accent colors
  secondary: "#5b9aa6",
  accent: "#4a8a96",

  // Semantic colors
  danger: "#e74c3c",
  dangerLight: "#fdeaea",
  warn: "#f39c12",
  warnLight: "#fef5e7",
  success: "#27ae60",
  successLight: "#e8f8ef",
  info: "#74becb",
  infoLight: "#e0f2f5",

  // Neutral colors
  muted: "#666",
  textPrimary: "#1a1a1a",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",

  // Background colors
  bg: "#fff",
  bgSecondary: "#f8fafa",
  surface: "#f2f2f2",
  surfaceLight: "#fafafa",

  // Border colors
  border: "#e5e7eb",
  borderLight: "#f3f4f6",
};

export const spacing = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 18,
};

export const shadows = StyleSheet.create({
  small: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
});

export default {
  colors,
  spacing,
  radii,
  shadows,
};
