import { NOTIFICATION_RECEIVED_EVENT, NOTIFICATION_UNREAD_KEY } from "@/constant";
import {
  countRiskNotifications,
  countTrackingNotifications,
} from "@/services/notifier";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { DeviceEventEmitter } from "react-native";

interface NotificationContextType {
  /** Combined tracking + risk unread count. Updates immediately from cache on boot. */
  unreadCount: number;
  /** Re-fetch the count from the server and reconcile with the local cache. */
  refreshCount: () => Promise<void>;
  /** Zero out the local count (called when the notifications screen opens). */
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function useNotificationContext(): NotificationContextType {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotificationContext must be used within NotificationProvider",
    );
  return ctx;
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const isMountedRef = useRef(true);

  // Fetch the server-side count and reconcile with the locally cached value.
  // Uses the higher of the two to avoid showing a stale 0 right after a
  // background notification incremented the cache but the server hasn't
  // been polled yet.
  const refreshCount = useCallback(async () => {
    try {
      const [tc, rc, cached] = await Promise.all([
        countTrackingNotifications(),
        countRiskNotifications(),
        AsyncStorage.getItem(NOTIFICATION_UNREAD_KEY).catch(() => null),
      ]);
      const serverCount = (tc.totalCount ?? 0) + (rc.totalCount ?? 0);
      const localCount = parseInt(cached ?? "0", 10) || 0;
      const merged = Math.max(serverCount, localCount);
      if (isMountedRef.current) setUnreadCount(merged);
    } catch {
      // Network failure — keep whatever count we already have.
    }
  }, []);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    AsyncStorage.removeItem(NOTIFICATION_UNREAD_KEY).catch(() => {});
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Boot: read the persisted cache immediately (no network needed) so the
    // badge appears before the server responds.
    AsyncStorage.getItem(NOTIFICATION_UNREAD_KEY)
      .then((val) => {
        const n = parseInt(val ?? "0", 10) || 0;
        if (n > 0 && isMountedRef.current) setUnreadCount(n);
      })
      .catch(() => {});

    // Then do a background network fetch to reconcile with the server.
    refreshCount();

    // Listen for events emitted by the background notification task so the
    // badge increments in real-time when a notification arrives while the
    // app is in the foreground.
    const sub = DeviceEventEmitter.addListener(
      NOTIFICATION_RECEIVED_EVENT,
      () => {
        if (isMountedRef.current) setUnreadCount((c) => c + 1);
      },
    );

    return () => {
      isMountedRef.current = false;
      sub.remove();
    };
  }, [refreshCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshCount, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}
