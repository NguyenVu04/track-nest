import { sos as sosLang } from "@/constant/languages";
import { useAuth } from "@/contexts/AuthContext";
import { useEmergency } from "@/contexts/EmergencyContext";
import { useTranslation } from "@/hooks/useTranslation";
import { showToast } from "@/utils";
import { colors } from "@/styles/styles";
import * as Notifications from "expo-notifications";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.6;

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
  const { user, isLoading: isAuthLoading } = useAuth();
  const [countdown, setCountdown] = useState(10);
  const [isCancelled, setIsCancelled] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const emergencyTriggeredRef = useRef(false);
  const autoActivatedRef = useRef(false);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      showToast(t.loginRequired);
      router.replace("/map");
    }
  }, [isAuthLoading, user, router]);

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
      () => true,
    );
    return () => backHandler.remove();
  }, [t.sosNotificationChannel]);

  const getTargetId = useCallback(() => user?.sub ?? "", [user?.sub]);

  const triggerEmergency = useCallback(async () => {
    if (emergencyTriggeredRef.current) return;
    if (!user) return;
    emergencyTriggeredRef.current = true;
    try {
      await createEmergencyRequest(getTargetId());
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t.emergencyActivatedTitle,
          body: t.emergencyActivatedBody,
        },
        trigger: null,
      });
      router.replace("/map");
    } catch {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t.emergencyFailedTitle,
          body: t.emergencyFailedBody,
        },
        trigger: null,
      });
      router.replace("/map");
    }
  }, [router, t, createEmergencyRequest, getTargetId]);

  useEffect(() => {
    const shouldAutoActivate = autoActivate === "1" || autoActivate === "true";
    if (!shouldAutoActivate || autoActivatedRef.current) return;
    autoActivatedRef.current = true;
    if (countdownRef.current) clearInterval(countdownRef.current);
    triggerEmergency();
  }, [autoActivate, triggerEmergency]);

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
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isCancelled]);

  useEffect(() => {
    if (countdown === 0 && !isCancelled) triggerEmergency();
  }, [countdown, isCancelled, triggerEmergency]);

  const cancelEmergency = useCallback(() => {
    setIsCancelled(true);
    if (countdownRef.current) clearInterval(countdownRef.current);
    router.replace("/map");
    Notifications.scheduleNotificationAsync({
      content: {
        title: t.emergencyCancelledTitle,
        body: t.emergencyCancelledBody,
      },
      trigger: null,
    });
  }, [router, t]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        if (gs.dx > 0) translateX.setValue(gs.dx);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > SWIPE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => cancelEmergency());
        } else {
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

  const trackBg = swipeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.2)", "rgba(76,217,100,0.5)"],
  });

  return (
    <View style={styles.container}>
      {/* Medical asterisk icon */}
      <View style={styles.iconCircle}>
        <Text style={styles.iconStar}>✳</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>{t.title}</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        {t.notifyingSubtitle.replace("{newline}", "\n")}
      </Text>

      {/* Frosted countdown circle */}
      <View style={styles.countdownCircle}>
        <Text style={styles.countdownNumber}>{countdown}</Text>
      </View>

      {/* Swipe to cancel */}
      <Text style={styles.actionLabel}>{t.actionRequired}</Text>

      <View style={styles.swipeContainer}>
        <Animated.View style={[styles.swipeTrack, { backgroundColor: trackBg }]}>
          <Text style={styles.swipeTrackText}>{t.swipeToCancel}</Text>
        </Animated.View>
        <Animated.View
          style={[styles.swipeThumb, { transform: [{ translateX }] }]}
          {...panResponder.panHandlers}
        >
          <Text style={styles.swipeChevrons}>{">>"}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconStar: {
    fontSize: 28,
    color: "#fff",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 24,
  },
  countdownCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
  },
  countdownNumber: {
    fontSize: 96,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 110,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  swipeContainer: {
    width: SCREEN_WIDTH - 64,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    overflow: "hidden",
  },
  swipeTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  swipeTrackText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  swipeThumb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  swipeChevrons: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.danger,
    letterSpacing: -2,
  },
});
