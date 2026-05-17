import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Combines safe-area insets with live window dimensions.
 * Use this in any component that positions elements absolutely or needs
 * to know the current screen size (e.g. FABs, map controls, bottom sheets).
 */
export const useSafeLayout = () => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  return { insets, width, height, isLandscape: width > height };
};
