import { colors, radii } from "@/styles/styles";
import React, { useEffect } from "react";
import { DimensionValue, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface SkeletonLoaderProps {
  width?: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonLoader({
  width = "100%",
  height,
  borderRadius = radii.sm,
  style,
}: SkeletonLoaderProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700 }),
        withTiming(0.4, { duration: 700 }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Layout lives on a regular View to avoid Reanimated's stricter style types
  // conflicting with `width: string | number`. The Animated.View handles only opacity.
  return (
    <View style={[{ width, height, borderRadius, overflow: "hidden" }, style]}>
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.border }, animatedStyle]}
      />
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={{ marginBottom: 14 }}>
      <SkeletonLoader width="100%" height={160} borderRadius={0} />
      <View style={{ paddingHorizontal: 12 }}>
        <SkeletonLoader width="70%" height={16} style={{ marginTop: 12 }} />
        <SkeletonLoader width="50%" height={12} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}
