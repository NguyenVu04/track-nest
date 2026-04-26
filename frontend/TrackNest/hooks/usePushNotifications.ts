import { registerMobileDevice } from "@/services/notifier";
import {
  configureNotificationHandler,
  registerForPushNotificationsAsync,
} from "@/utils/notifications";
import * as Notifications from "expo-notifications";
import { Router, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

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
        console.log("Device registered with backend for FCM");
      } catch (err) {
        console.error("Failed to register device with backend:", err);
      }
    });

    // 2. Foreground notification listener
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received in foreground:", notification);
      });

    // 3. Notification tap / interaction listener
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log("Notification tapped, data:", data);

        // Navigate based on notification data
        if (data?.route) {
          router.push(data.route as Parameters<Router["push"]>[0]);
        }
      });

    // 4. Token refresh listener — re-register when FCM rotates the token
    tokenRefreshListener.current = Notifications.addPushTokenListener(
      async (newToken) => {
        const token = newToken.data as string;
        console.log("FCM token refreshed:", token);
        setFcmToken(token);

        try {
          const platform = Platform.OS;
          await registerMobileDevice(token, platform, "en");
          console.log("Refreshed token registered with backend");
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
