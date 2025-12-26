import { StyleSheet } from "react-native";

export const colors = {
  primary: "#0b62ff",
  danger: "#ff3b30",
  warn: "#ff9f0a",
  success: "#34c759",
  muted: "#666",
  bg: "#fff",
  surface: "#f2f2f2",
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
