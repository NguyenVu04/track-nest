import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";

type Props = {
  latitude: number;
  longitude: number;
  disabled?: boolean; // when true show subdued grey dot and pause pulse
};

export default function CurrentLocationMarker({
  latitude,
  longitude,
  disabled = false,
}: Props) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;
  const animRef = useRef<any>(null);

  useEffect(() => {
    if (disabled) {
      // stop animation and set subdued visuals
      animRef.current?.stop?.();
      opacity.setValue(0.2);
      scale.setValue(0.6);
      return;
    }

    scale.setValue(0);
    opacity.setValue(0.6);

    animRef.current = Animated.loop(
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    animRef.current.start();
    return () => animRef.current?.stop?.();
  }, [scale, opacity, disabled]);
  
  const pulseScale = scale.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 2.2],
  });

  const outerBorder = disabled ? "#bdbdbd" : "rgba(43,159,255,0.9)";
  const innerColor = disabled ? "#999" : "#2b9fff";
  const pulseColor = disabled ? "rgba(0,0,0,0)" : "rgba(43,159,255,0.25)";

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={true}
    >
      <View style={localStyles.wrapper}>
        <Animated.View
          style={[
            localStyles.pulse,
            {
              transform: [{ scale: pulseScale }],
              opacity,
              backgroundColor: pulseColor,
            },
          ]}
        />
        <View style={[localStyles.dotOuter, { borderColor: outerBorder }]}>
          <View
            style={[localStyles.dotInner, { backgroundColor: innerColor }]}
          />
        </View>
      </View>
    </Marker>
  );
}

const localStyles = StyleSheet.create({
  wrapper: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 28 / 2,
    backgroundColor: "rgba(43,159,255,0.25)",
  },
  dotOuter: {
    width: 22,
    height: 22,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  dotInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#2b9fff",
  },
});
