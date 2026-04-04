import { sos as sosLang } from "@/constant/languages";
import { useEmergency } from "@/contexts/EmergencyContext";
import { useTranslation } from "@/hooks/useTranslation";
import { colors } from "@/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.6;

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function SosScreen() {
  const router = useRouter();
  const { autoActivate } = useLocalSearchParams<{ autoActivate?: string }>();
  const t = useTranslation(sosLang);
  const { createEmergencyRequest } = useEmergency();
  const [countdown, setCountdown] = useState(10);
  const [isCancelled, setIsCancelled] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const emergencyTriggeredRef = useRef(false);
  const autoActivatedRef = useRef(false);

  // Setup notifications and prevent hardware back button
  useEffect(() => {
    const setupNotifications = async () => {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("sos", {
          name: t.sosNotificationChannel,
          importance: Notifications.AndroidImportance.HIGH,
        });
      }
      await Notifications.requestPermissionsAsync();
    };
    setupNotifications();

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true, // Return true to prevent default behavior
    );

    return () => backHandler.remove();
  }, [t.sosNotificationChannel]);

  const getTargetId = useCallback(() => {
    // For now, use a default target ID
    // In a full implementation, this would be selected from available family members
    return "default-target-id";
  }, []);

  const triggerEmergency = useCallback(async () => {
    if (emergencyTriggeredRef.current) return;
    emergencyTriggeredRef.current = true;

    try {
      // Create emergency request via backend API
      const targetId = getTargetId();
      await createEmergencyRequest(targetId);
      
      // Show success notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t.emergencyActivatedTitle,
          body: t.emergencyActivatedBody,
        },
        trigger: null,
      });
      
      // Navigate back to map - emergency status will be visible
      router.replace("/map");
    } catch (error) {
      console.error("Emergency request failed:", error);
      
      // Show error notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Emergency Request Failed",
          body: "Please try again or call emergency services directly",
        },
        trigger: null,
      });
      
      // Navigate back to map on error
      router.replace("/map");
    }
  }, [router, t, createEmergencyRequest, getTargetId]);

  useEffect(() => {
    const shouldAutoActivate = autoActivate === "1" || autoActivate === "true";
    if (!shouldAutoActivate || autoActivatedRef.current) return;

    autoActivatedRef.current = true;
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    triggerEmergency();
  }, [autoActivate, triggerEmergency]);

  // Countdown timer
  useEffect(() => {
    if (isCancelled) return;

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [isCancelled]);

  // Trigger emergency when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && !isCancelled) {
      triggerEmergency();
    }
  }, [countdown, isCancelled, triggerEmergency]);

  const cancelEmergency = () => {
    setIsCancelled(true);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    router.replace("/map");
    Notifications.scheduleNotificationAsync({
      content: {
        title: t.emergencyCancelledTitle,
        body: t.emergencyCancelledBody,
      },
      trigger: null,
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Only allow rightward movement
        if (gestureState.dx > 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swipe successful - cancel emergency
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            cancelEmergency();
          });
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 5,
          }).start();
        }
      },
    }),
  ).current;

  const swipeProgress = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const trackBackgroundColor = swipeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.2)", "rgba(76,217,100,0.5)"],
  });

  return (
    <View style={styles.container}>
      {/* Pulsing background effect */}
      <View style={styles.pulseBackground} />

      {/* Emergency icon */}
      <View style={styles.iconContainer}>
        <Ionicons name="warning" size={80} color="#fff" />
      </View>

      {/* Title */}
      <Text style={styles.title}>{t.title}</Text>

      {/* Countdown */}
      <View style={styles.countdownContainer}>
        <Text style={styles.countdownNumber}>{countdown}</Text>
        <Text style={styles.countdownLabel}>{t.seconds}</Text>
      </View>

      {/* Instruction */}
      <Text style={styles.instruction}>
        {t.instruction.replace("{countdown}", String(countdown))}
      </Text>

      {/* Swipe to cancel button */}
      <View style={styles.swipeContainer}>
        <Animated.View
          style={[styles.swipeTrack, { backgroundColor: trackBackgroundColor }]}
        >
          <Text style={styles.swipeTrackText}>{t.swipeToCancel}</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.swipeButton,
            {
              transform: [{ translateX }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Ionicons name="close" size={32} color={colors.danger} />
        </Animated.View>
      </View>

      {/* Immediate emergency button */}
      <Pressable
        style={({ pressed }) => [
          styles.emergencyButton,
          pressed && styles.emergencyButtonPressed,
        ]}
        onPress={() => {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          triggerEmergency();
        }}
      >
        <Ionicons name="call" size={20} color="#fff" />
        <Text style={styles.emergencyButtonText}>{t.sendEmergencyNow}</Text>
      </Pressable>

      {/* Additional info */}
      <Text style={styles.infoText}>{t.infoText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  pulseBackground: {
    position: "absolute",
    width: "200%",
    height: "200%",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 32,
    letterSpacing: 2,
  },
  countdownContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  countdownNumber: {
    fontSize: 72,
    fontWeight: "bold",
    color: "#fff",
  },
  countdownLabel: {
    fontSize: 18,
    color: "rgba(255,255,255,0.8)",
    marginTop: -8,
  },
  instruction: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  swipeContainer: {
    width: SCREEN_WIDTH - 48,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    overflow: "hidden",
  },
  swipeTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 32,
  },
  swipeTrackText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontWeight: "500",
  },
  swipeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  emergencyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
    marginTop: 24,
    gap: 8,
  },
  emergencyButtonPressed: {
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  emergencyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginTop: 24,
  },
});
