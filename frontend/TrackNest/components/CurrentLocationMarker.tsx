import { CurrentLocationMarker as currentLocationMarkerLang } from "@/constant/languages";
import useDeviceHeading from "@/hooks/useDeviceHeading";
import { useTranslation } from "@/hooks/useTranslation";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";

type Props = {
  latitude: number;
  longitude: number;
  speed?: number | null; // speed in m/s
  disabled?: boolean; // when true show subdued grey dot and pause pulse
};

export default function CurrentLocationMarker({
  latitude,
  longitude,
  speed,
  disabled = false,
}: Props) {
  const t = useTranslation(currentLocationMarkerLang);
  // Get heading from dedicated hook - updates only re-render this component
  const { heading } = useDeviceHeading(!disabled);

  // Convert speed from m/s to km/h
  const speedKmh = speed != null ? Math.round(speed * 3.6) : null;
  const hasMovementData = heading != null || speedKmh != null;
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
      ]),
    );

    animRef.current.start();
    return () => animRef.current?.stop?.();
  }, [scale, opacity, disabled]);

  const pulseScale = scale.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 2.2],
  });

  const outerBorder = disabled ? "#bdbdbd" : "rgba(116,190,203,0.9)";
  const innerColor = disabled ? "#999" : "#74becb";
  const pulseColor = disabled ? "rgba(0,0,0,0)" : "rgba(116,190,203,0.25)";

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      tracksViewChanges={true}
      anchor={{ x: 0.5, y: 0.5 }}
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

        {heading != null && !disabled && (
          <View
            style={[
              localStyles.headingArrow,
              { transform: [{ rotate: `${heading}deg` }] },
            ]}
          >
            <View style={localStyles.arrowHead} />
          </View>
        )}
        <View style={[localStyles.dotOuter, { borderColor: outerBorder }]}>
          <View
            style={[localStyles.dotInner, { backgroundColor: innerColor }]}
          />
        </View>
        {hasMovementData && !disabled && (
          <View style={localStyles.speedContainer}>
            <Text style={localStyles.speedText}>
              {speedKmh != null ? `${speedKmh} ${t.speedUnit}` : ""}
            </Text>
          </View>
        )}
      </View>
    </Marker>
  );
}

const localStyles = StyleSheet.create({
  wrapper: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 38 / 2,
    backgroundColor: "rgba(116,190,203,0.25)",
    top: (1 / 2) * 60 - 19,
    left: (1 / 2) * 60 - 19,
  },
  headingArrow: {
    position: "absolute",
    width: 60,
    height: 40,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "rgba(116,190,203,1)",
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
    backgroundColor: "#74becb",
  },
  speedContainer: {
    position: "absolute",
    bottom: 3,
    backgroundColor: "rgba(116,190,203,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  speedText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
});
