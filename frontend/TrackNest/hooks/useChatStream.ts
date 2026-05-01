import {
  CHAT_BADGE_CHANGED_EVENT,
  CHAT_CIRCLE_CHANGED_EVENT,
  CHAT_FOCUS_EVENT,
  CHAT_NEW_MESSAGE_EVENT,
  CHAT_UNREAD_KEY,
} from "@/constant";
import type { Message } from "@/proto/familymessenger_pb";
import { streamFamilyMessages } from "@/services/familyMessenger";
import { getUserId } from "@/utils";
import {
  scheduleChatMessageNotification,
  setupChatNotificationChannel,
} from "@/utils/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import type { ClientReadableStream } from "grpc-web";
import { useEffect, useRef } from "react";
import { DeviceEventEmitter } from "react-native";
import { STORAGE_KEY as SELECTED_CIRCLE_KEY } from "./useFamilyCircle";

/**
 * Mounts a persistent gRPC stream for the selected family circle.
 * Lives in app/(app)/_layout.tsx so it survives tab navigation.
 *
 * Responsibilities:
 *  - Emit CHAT_NEW_MESSAGE_EVENT for every incoming message (chat screen dedupes)
 *  - When the sender is not the current user and the chat tab is not focused:
 *      show a local notification, persist unread count, emit CHAT_BADGE_CHANGED_EVENT
 *  - Clear unread and emit badge=0 when the chat tab gains focus
 *  - Restart the stream when CHAT_CIRCLE_CHANGED_EVENT fires
 */
export function useChatStream(enabled: boolean) {
  const streamRef = useRef<ClientReadableStream<Message> | null>(null);
  const circleIdRef = useRef<string | null>(null);
  const isFocusedRef = useRef(false);
  const unreadCountRef = useRef(0);
  const currentUserIdRef = useRef<string | null>(null);

  const stopStream = () => {
    streamRef.current?.cancel();
    streamRef.current = null;
  };

  const clearUnread = async () => {
    unreadCountRef.current = 0;
    await AsyncStorage.setItem(CHAT_UNREAD_KEY, "0");
    DeviceEventEmitter.emit(CHAT_BADGE_CHANGED_EVENT, 0);
  };

  const startStream = async (circleId: string) => {
    stopStream();
    try {
      const stream = await streamFamilyMessages(
        circleId,
        async (msg) => {
          DeviceEventEmitter.emit(CHAT_NEW_MESSAGE_EVENT, msg);

          if (msg.senderId === currentUserIdRef.current) return;
          if (isFocusedRef.current) return;

          unreadCountRef.current += 1;
          await AsyncStorage.setItem(CHAT_UNREAD_KEY, String(unreadCountRef.current));
          DeviceEventEmitter.emit(CHAT_BADGE_CHANGED_EVENT, unreadCountRef.current);
          await scheduleChatMessageNotification(msg.senderName || msg.senderId.slice(0, 8), msg.messageContent);
        },
        (err) => console.warn("[ChatStream] error:", err.message),
      );
      streamRef.current = stream;
    } catch (err) {
      console.error("[ChatStream] failed to start:", err);
    }
  };

  useEffect(() => {
    if (!enabled) {
      stopStream();
      return;
    }

    const init = async () => {
      setupChatNotificationChannel();
      currentUserIdRef.current = await getUserId().catch(() => null);

      const [savedCircleId, storedUnread, presentedNotifs] = await Promise.all([
        AsyncStorage.getItem(SELECTED_CIRCLE_KEY),
        AsyncStorage.getItem(CHAT_UNREAD_KEY),
        Notifications.getPresentedNotificationsAsync(),
      ]);

      // The background notification task does not fire for notification+data FCM
      // on Android, so CHAT_UNREAD_KEY may be stale (0) after the app was
      // backgrounded. Count pending chat notifications in the system tray as a
      // floor for the badge so the count is never lower than what the OS shows.
      const storedCount = parseInt(storedUnread ?? "0", 10) || 0;
      const pendingCount = presentedNotifs.filter(
        (n) => n.request.content.data?.type === "chat_message",
      ).length;
      const count = Math.max(storedCount, pendingCount);

      unreadCountRef.current = count;
      if (count > 0) {
        await AsyncStorage.setItem(CHAT_UNREAD_KEY, String(count));
        DeviceEventEmitter.emit(CHAT_BADGE_CHANGED_EVENT, count);
      }

      if (savedCircleId) {
        circleIdRef.current = savedCircleId;
        await startStream(savedCircleId);
      }
    };

    init();

    const circleSub = DeviceEventEmitter.addListener(
      CHAT_CIRCLE_CHANGED_EVENT,
      ({ circleId }: { circleId: string | null }) => {
        if (circleId === circleIdRef.current) return;
        circleIdRef.current = circleId;
        if (circleId) {
          startStream(circleId);
        } else {
          stopStream();
        }
      },
    );

    const focusSub = DeviceEventEmitter.addListener(
      CHAT_FOCUS_EVENT,
      ({ focused }: { focused: boolean }) => {
        isFocusedRef.current = focused;
        if (focused) clearUnread();
      },
    );

    return () => {
      stopStream();
      circleSub.remove();
      focusSub.remove();
    };
  }, [enabled]);
}
