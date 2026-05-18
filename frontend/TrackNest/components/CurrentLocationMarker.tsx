// import { CurrentLocationMarker as currentLocationMarkerLang } from "@/constant/languages";
import useDeviceHeading from "@/hooks/useDeviceHeading";
// import { useTranslation } from "@/hooks/useTranslation";
import { colors } from "@/styles/styles";
import { fontScale, moderateScale } from "@/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { MapMarker, Marker } from "react-native-maps";

type Props = {
  latitude: number;
  longitude: number;
  speed?: number | null; // speed in m/s
  disabled?: boolean; // when true show subdued grey dot and pause pulse
  isEmergency?: boolean; // when true show red pulsing emergency marker
  handlePress?: () => void; // optional press handler for the marker
};

const MIN_MARKER_MOVEMENT_DELTA = 0.00003;

function CurrentLocationMarker({
  latitude,
  longitude,
  speed,
  disabled = false,
  isEmergency = false,
  handlePress,
}: Props) {
  // const t = useTranslation(currentLocationMarkerLang);
  const { heading } = useDeviceHeading(!disabled);

  // Convert speed from m/s to km/h
  const speedKmh = speed != null ? Math.round(speed * 3.6) : null;
  const hasSpeedData = speedKmh != null;

  const [tracksViewChanges, setTracksViewChanges] = useState(false);
  const [markerCoordinate, setMarkerCoordinate] = useState({
    latitude,
    longitude,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markerRef = useRef<MapMarker>(null);
  const hasInitialCoordinateRef = useRef(false);
  const lastAcceptedCoordinateRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    const next = { latitude, longitude };

    if (!hasInitialCoordinateRef.current) {
      hasInitialCoordinateRef.current = true;
      lastAcceptedCoordinateRef.current = next;
      setMarkerCoordinate(next);
      return;
    }

    const prev = lastAcceptedCoordinateRef.current;
    if (prev) {
      const latDiff = Math.abs(next.latitude - prev.latitude);
      const lngDiff = Math.abs(next.longitude - prev.longitude);
      if (
        latDiff < MIN_MARKER_MOVEMENT_DELTA &&
        lngDiff < MIN_MARKER_MOVEMENT_DELTA
      ) {
        return;
      }
    }

    if (
      Platform.OS === "android" &&
      markerRef.current?.animateMarkerToCoordinate
    ) {
      markerRef.current.animateMarkerToCoordinate(next, 500);
    }

    lastAcceptedCoordinateRef.current = next;
    setMarkerCoordinate(next);
  }, [latitude, longitude]);

  useEffect(() => {
    setTracksViewChanges(true);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setTracksViewChanges(false);
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [heading, speedKmh, disabled]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (markerRef.current && tracksViewChanges) {
        markerRef.current.redraw();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [tracksViewChanges]);

  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;
  const animRef = useRef<any>(null);

  useEffect(() => {
    animRef.current?.stop?.();

    if (disabled) {
      opacity.setValue(0.2);
      scale.setValue(0.6);
      return;
    }

    scale.setValue(0);
    opacity.setValue(0.6);

    // Emergency mode pulses twice as fast to signal urgency.
    const duration = isEmergency ? 600 : 1200;

    animRef.current = Animated.loop(
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]),
    );

    animRef.current.start();
    return () => animRef.current?.stop?.();
  }, [scale, opacity, disabled, isEmergency]);

  const pulseScale = scale.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 2.2],
  });

  const outerBorder = disabled
    ? "#bdbdbd"
    : isEmergency
      ? "rgba(204,46,29,0.9)"
      : "rgba(116,190,203,0.9)";
  const innerColor = disabled
    ? "#999"
    : isEmergency
      ? colors.danger
      : "#74becb";

  return (
    <Marker
      ref={markerRef}
      coordinate={markerCoordinate}
      tracksViewChanges={true}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={(e) => {
        e.stopPropagation();
        handlePress?.();
      }}
    >
      <View style={localStyles.wrapper}>
        <Animated.View
          style={[
            localStyles.pulse,
            {
              transform: [{ scale: pulseScale }],
              opacity,
              backgroundColor: isEmergency
                ? "rgba(204,46,29,0.25)"
                : "rgba(116,190,203,0.25)",
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
        {isEmergency && !disabled && (
          <View style={localStyles.emergencyIconWrap}>
            <Ionicons
              name="alert-circle"
              size={moderateScale(12)}
              color={colors.danger}
            />
          </View>
        )}
        {hasSpeedData && (
          <View style={localStyles.speedContainer}>
            <Text style={localStyles.speedText}>{`${speedKmh} km/h`}</Text>
          </View>
        )}
      </View>
    </Marker>
  );
}

const WRAPPER = moderateScale(56);
const PULSE = moderateScale(36);
const DOT_OUTER = moderateScale(22);
const DOT_INNER = moderateScale(14);

const localStyles = StyleSheet.create({
  wrapper: {
    width: WRAPPER,
    height: WRAPPER,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: PULSE,
    height: PULSE,
    borderRadius: PULSE / 2,
    backgroundColor: "rgba(116,190,203,0.25)",
    top: WRAPPER / 2 - PULSE / 2,
    left: WRAPPER / 2 - PULSE / 2,
  },
  headingArrow: {
    position: "absolute",
    width: WRAPPER,
    height: moderateScale(38),
    alignItems: "center",
    justifyContent: "flex-start",
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: moderateScale(5),
    borderRightWidth: moderateScale(5),
    borderBottomWidth: moderateScale(10),
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "rgba(116,190,203,1)",
  },
  dotOuter: {
    width: DOT_OUTER,
    height: DOT_OUTER,
    borderRadius: DOT_OUTER / 2,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  dotInner: {
    width: DOT_INNER,
    height: DOT_INNER,
    borderRadius: DOT_INNER / 2,
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
    fontSize: fontScale(10),
    fontWeight: "600",
  },
  emergencyIconWrap: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: moderateScale(8),
  },
});

export default React.memo(CurrentLocationMarker);
