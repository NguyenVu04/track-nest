import { Dimensions, PixelRatio } from "react-native";

const BASE_WIDTH = 390; // iPhone 15 Pro reference baseline
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/** Scale a layout dimension proportionally to screen width. */
export const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;

/**
 * Like scale() but grows more slowly — good for icons and markers that
 * should be larger on big screens but not grow as fast as the layout does.
 */
export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

/**
 * Scale a font size relative to both screen width and the user's
 * accessibility font-size preference (PixelRatio.getFontScale()).
 */
export const fontScale = (size: number) =>
  Math.round(size * PixelRatio.getFontScale() * (SCREEN_WIDTH / BASE_WIDTH));

export const isTablet = () => SCREEN_WIDTH >= 768;
export const isSmallPhone = () => SCREEN_WIDTH < 360;

export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;
