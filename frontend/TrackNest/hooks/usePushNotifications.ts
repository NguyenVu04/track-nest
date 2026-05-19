import {
  CHAT_BADGE_CHANGED_EVENT,
  CHAT_UNREAD_KEY,
  FCM_TOKEN_KEY,
} from "@/constant";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { registerMobileDevice } from "@/services/notifier";
import {
  configureNotificationHandler,
  registerForPushNotificationsAsync,
} from "@/utils/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Router, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

configureNotificationHandler();

async function retryWithBackoff(
  fn: () => Promise<void>,
  delays: number[],
): Promise<void> {
  for (let i = 0; i <= delays.length; i++) {
    try {
      await fn();
      return;
    } catch (err) {
      if (i === delays.length) throw err;
      await new Promise((r) => setTimeout(r, delays[i]));
    }
  }
}

/**
 * Hook that manages the full FCM push-notification lifecycle:
 * - Requests permission & retrieves the FCM device token
 * - Persists the token to AsyncStorage and re-registers it on boot
 *   even if the backend was unreachable at the previous session
 * - Registers the token with the backend with exponential-backoff retry
 * - Listens for incoming notifications (foreground)
 * - Handles notification taps (background / killed)
 * - Listens for token refreshes and re-registers
 */
export function usePushNotifications(
  enabled: boolean = true,
  onEmergencyNotification?: (type: string) => void,
) {
  const [fcmToken, setFcmToken] = useState<string | undefined>();
  const notificationListener = useRef<Notifications.EventSubscription>(null);
  const responseListener = useRef<Notifications.EventSubscription>(null);
  const tokenRefreshListener = useRef<Notifications.EventSubscription>(null);
  const router = useRouter();
  const { refreshCount } = useNotificationContext();

  useEffect(() => {
    if (!enabled) return;

    const RETRY_DELAYS = [1_000, 2_000, 4_000];

    const registerToken = async (token: string) => {
      const platform = Platform.OS;
      await retryWithBackoff(
        () => registerMobileDevice(token, platform, "en").then(() => {}),
        RETRY_DELAYS,
      );
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
    };

    // Fast path: re-register cached token immediately on boot so the device
    // keeps receiving notifications even if getDevicePushTokenAsync is slow.
    AsyncStorage.getItem(FCM_TOKEN_KEY)
      .then((cached) => {
        if (cached) {
          registerToken(cached).catch((err) =>
            console.warn("Cached token re-registration failed:", err),
          );
        }
      })
      .catch(() => {});

    // Full path: request a fresh token, compare with cache, register if changed.
    registerForPushNotificationsAsync().then(async (token) => {
      console.log("Obtained FCM token:", token);
      if (!token) return;
      setFcmToken(token);

      const cached = await AsyncStorage.getItem(FCM_TOKEN_KEY).catch(
        () => null,
      );
      if (token === cached) return; // already registered with backend

      try {
        await registerToken(token);
      } catch (err) {
        console.error("Failed to register device token after retries:", err);
      }
    });

    const EMERGENCY_TYPES = [
      "EMERGENCY_REQUEST_ASSIGNED",
      "EMERGENCY_REQUEST_ACCEPTED",
      "EMERGENCY_REQUEST_REJECTED",
      "EMERGENCY_REQUEST_CLOSED",
    ];

    // Types that signal the emergency is over — clear the marker immediately.
    const EMERGENCY_TERMINAL_TYPES = [
      "EMERGENCY_REQUEST_REJECTED",
      "EMERGENCY_REQUEST_CLOSED",
    ];

    // Foreground FCM listener — chat suppressed (gRPC stream handles those).
    // For emergency terminal events, notify the caller so it can clear state
    // without waiting for the next useFocusEffect cycle.
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        const type = notification.request.content.data?.type as string | undefined;
        if (type && EMERGENCY_TERMINAL_TYPES.includes(type)) {
          onEmergencyNotification?.(type);
        }
      });

    // Notification tap / interaction listener (app backgrounded).
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;

        // Refresh the bell badge after the user taps any notification.
        refreshCount().catch(() => {});

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
    // We track the handled notification ID in AsyncStorage to avoid re-routing
    // on subsequent app opens.
    const LAST_HANDLED_NOTIF_KEY = "last_handled_notification_id";
    (async () => {
      const lastNotiResponse = Notifications.getLastNotificationResponse();
      if (!lastNotiResponse) return;

      const notifId = lastNotiResponse.notification.request.identifier;
      const lastHandled = await AsyncStorage.getItem(LAST_HANDLED_NOTIF_KEY);
      if (lastHandled === notifId) return;
      await AsyncStorage.setItem(LAST_HANDLED_NOTIF_KEY, notifId);

      const data = lastNotiResponse.notification.request.content.data;

      // Reconcile badge count after killed-state launch.
      refreshCount().catch(() => {});

      if (data?.type && EMERGENCY_TYPES.includes(data.type as string)) {
        router.push("/(app)/sos");
        return;
      }

      if (data?.route) {
        router.push(data.route as Parameters<Router["push"]>[0]);
      }
    })().catch(() => {});

    // Token refresh listener — re-register when FCM rotates the token.
    tokenRefreshListener.current = Notifications.addPushTokenListener(
      async (newToken) => {
        const token = newToken.data as string;
        setFcmToken(token);

        try {
          await registerToken(token);
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
  }, [enabled, router, refreshCount, onEmergencyNotification]);

  return { fcmToken };
}
