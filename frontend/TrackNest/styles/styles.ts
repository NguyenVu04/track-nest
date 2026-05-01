import { StyleSheet } from "react-native";

export const colors = {
  // Primary palette based on #0c6874
  primary: "#0c6874",
  primaryDark: "#084c55",
  primaryLight: "#3e8d98",
  primaryMuted: "#d8ecef",

  // Secondary/accent colors
  secondary: "#2f7f8b",
  accent: "#5aa8b5",

  // Semantic colors
  danger: "#cc2e1d",
  dangerLight: "#fdeaea",
  warn: "#f39c12",
  warnLight: "#fef5e7",
  success: "#27ae60",
  successLight: "#e8f8ef",
  info: "#2f8fa0",
  infoLight: "#e8f4f6",

  // Neutral colors
  muted: "#666",
  textPrimary: "#1a1a1a",
  textSecondary: "#4f6670",
  textMuted: "#7b9098",

  // Background colors
  bg: "#fff",
  bgSecondary: "#f3f8f9",
  surface: "#edf5f6",
  surfaceLight: "#f8fbfc",

  // Border colors
  border: "#d7e5e8",
  borderLight: "#e8f1f3",
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
