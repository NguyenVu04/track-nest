import { config as base } from "@tamagui/config/v3";
import { createTamagui, createTokens } from "tamagui";

export const tamaguiConfig = createTamagui({
  ...base,
  tokens: createTokens({
    ...base.tokens,
    color: {
      ...base.tokens.color,
      // Primary palette
      primary: "#0c6874",
      primaryDark: "#084c55",
      primaryLight: "#3e8d98",
      primaryMuted: "#d8ecef",
      // Secondary / accent
      secondary: "#2f7f8b",
      accent: "#5aa8b5",
      // Semantic
      danger: "#cc2e1d",
      dangerLight: "#fdeaea",
      warn: "#f39c12",
      warnLight: "#fef5e7",
      success: "#27ae60",
      successLight: "#e8f8ef",
      info: "#2f8fa0",
      infoLight: "#e8f4f6",
      // Neutral
      muted: "#666666",
      textPrimary: "#1a1a1a",
      textSecondary: "#4f6670",
      textMuted: "#7b9098",
      // Backgrounds
      bg: "#ffffff",
      bgSecondary: "#f3f8f9",
      surface: "#edf5f6",
      surfaceLight: "#f8fbfc",
      // Borders
      border: "#d7e5e8",
      borderLight: "#e8f1f3",
    },
    space: {
      ...base.tokens.space,
      xs: 6,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
    },
    radius: {
      ...base.tokens.radius,
      sm: 8,
      md: 12,
      lg: 18,
    },
  }),
});

export default tamaguiConfig;
