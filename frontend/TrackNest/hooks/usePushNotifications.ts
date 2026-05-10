import {
  CHAT_BADGE_CHANGED_EVENT,
  CHAT_UNREAD_KEY,
} from "@/constant";
import { registerMobileDevice } from "@/services/notifier";
import {
  configureNotificationHandler,
  registerForPushNotificationsAsync,
} from "@/utils/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Router, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { DeviceEventEmitter, Platform } from "react-native";

configureNotificationHandler();

/**
 * Hook that manages the full FCM push-notification lifecycle:
 * - Requests permission & retrieves the FCM device token
 * - Registers the token with the backend
 * - Listens for incoming notifications (foreground)
 * - Handles notification taps (background / killed)
 * - Listens for token refreshes and re-registers
 */
export function usePushNotifications(enabled: boolean = true) {
  const [fcmToken, setFcmToken] = useState<string | undefined>();
  const notificationListener = useRef<Notifications.EventSubscription>(null);
  const responseListener = useRef<Notifications.EventSubscription>(null);
  const tokenRefreshListener = useRef<Notifications.EventSubscription>(null);
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // 1. Register for push notifications and send token to backend
    registerForPushNotificationsAsync().then(async (token) => {
      if (!token) return;
      setFcmToken(token);

      try {
        const platform = Platform.OS; // "android" | "ios"
        await registerMobileDevice(token, platform, "en");
        /* console.log("Device registered with backend for FCM") */;
      } catch (err) {
        console.error("Failed to register device with backend:", err);
      }
    });

    // 2. Foreground FCM listener.
    // Chat notifications are suppressed by configureNotificationHandler (the
    // gRPC stream handles those). Emergency notifications show system banners.
    notificationListener.current =
      Notifications.addNotificationReceivedListener((_notification) => {
        /* console.log("Notification received in foreground:", _notification) */;
      });

    const EMERGENCY_TYPES = [
      "EMERGENCY_REQUEST_ASSIGNED",
      "EMERGENCY_REQUEST_ACCEPTED",
      "EMERGENCY_REQUEST_REJECTED",
      "EMERGENCY_REQUEST_CLOSED",
    ];

    // 3. Notification tap / interaction listener (app backgrounded).
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        /* console.log("Notification tapped, data:", data) */;

        if (data?.type && EMERGENCY_TYPES.includes(data.type as string)) {
          router.push("/(app)/sos");
          return;
        }

        if (data?.route) {
          router.push(data.route as Parameters<Router["push"]>[0]);
        }
      });

    // 4. Killed-state launch: app was opened by tapping a notification.
    // addNotificationResponseReceivedListener does not fire in this case,
    // so we check the last stored response once on mount.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data;

      if (data?.type && EMERGENCY_TYPES.includes(data.type as string)) {
        router.push("/(app)/sos");
        return;
      }

      if (data?.route) {
        router.push(data.route as Parameters<Router["push"]>[0]);
      }
    });

    // 4. Token refresh listener — re-register when FCM rotates the token
    tokenRefreshListener.current = Notifications.addPushTokenListener(
      async (newToken) => {
        const token = newToken.data as string;
        /* console.log("FCM token refreshed:", token) */;
        setFcmToken(token);

        try {
          const platform = Platform.OS;
          await registerMobileDevice(token, platform, "en");
          /* console.log("Refreshed token registered with backend") */;
        } catch (err) {
          console.error("Failed to register refreshed token:", err);
        }
      },
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
      tokenRefreshListener.current?.remove();
    };
  }, [enabled, router]);

  return { fcmToken };
}
