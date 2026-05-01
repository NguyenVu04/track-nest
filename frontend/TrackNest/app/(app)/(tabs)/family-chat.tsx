import FamilyCircleListSheet from "@/components/BottomSheets/FamilyCircleListSheet";
import {
  CHAT_CIRCLE_CHANGED_EVENT,
  CHAT_FOCUS_EVENT,
  CHAT_NEW_MESSAGE_EVENT,
} from "@/constant";
import { familyChat as familyChatLang } from "@/constant/languages";
import type { FamilyCircle } from "@/constant/types";
import { useFamilyCircle } from "@/hooks/useFamilyCircle";
import { useTranslation } from "@/hooks/useTranslation";
import type { Message as ProtoMessage } from "@/proto/familymessenger_pb";
import type { ListFamilyCircleMembersResponse } from "@/proto/trackingmanager_pb";
import {
  listFamilyMessages,
  sendFamilyMessage,
} from "@/services/familyMessenger";
import { listFamilyCircleMembers } from "@/services/trackingManager";
import { colors, radii, spacing } from "@/styles/styles";
import { getUserId } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FamilyChatTranslations = ReturnType<
  typeof useTranslation<typeof familyChatLang>
>;

type ChatMessage = {
  messageId: string;
  senderId: string;
  content: string;
  sentAtMs: number;
};

type MemberInfo =
  ListFamilyCircleMembersResponse.AsObject["membersList"][number];

const PAGE_SIZE = 50;

function formatClock(ms: number) {
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDayLabel(ms: number, todayLabel: string) {
  const d = new Date(ms);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const time = formatClock(ms);
  return isToday
    ? `${todayLabel}, ${time}`
    : `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
}

function AvatarCircle({
  name,
  avatarUrl,
  size = 34,
}: {
  name: string;
  avatarUrl?: string;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      />
    );
  }
  const letter = (name || "?").charAt(0).toUpperCase();
  return (
    <View
      style={[
        styles.avatar,
        styles.avatarFallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarLetter, { fontSize: size * 0.4 }]}>
        {letter}
      </Text>
    </View>
  );
}

function AvatarStack({ members }: { members: MemberInfo[] }) {
  const visible = members.slice(0, 3);
  const overflow = Math.max(0, members.length - visible.length);
  return (
    <View style={styles.avatarStack}>
      {visible.map((m, i) => (
        <View
          key={m.memberId}
          style={[
            styles.stackAvatarWrap,
            { marginLeft: i > 0 ? -8 : 0, zIndex: visible.length - i },
          ]}
        >
          <AvatarCircle
            name={m.memberUsername}
            avatarUrl={m.memberAvatarUrl}
            size={30}
          />
        </View>
      ))}
      {overflow > 0 && (
        <View
          style={[
            styles.stackAvatarWrap,
            styles.stackOverflow,
            { marginLeft: -8 },
          ]}
        >
          <Text style={styles.stackOverflowText}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
}

function ChatBubble({
  message,
  isMe,
  sender,
  showSender,
}: {
  message: ChatMessage;
  isMe: boolean;
  sender?: MemberInfo;
  showSender: boolean;
}) {
  if (isMe) {
    return (
      <View style={styles.outboundRow}>
        <View style={styles.outboundBubble}>
          <Text style={styles.outboundText}>{message.content}</Text>
        </View>
        <Text style={styles.outboundMeta}>{formatClock(message.sentAtMs)}</Text>
      </View>
    );
  }
  return (
    <View style={styles.inboundGroup}>
      <View style={styles.inboundAvatar}>
        {showSender ? (
          <AvatarCircle
            name={sender?.memberUsername ?? "?"}
            avatarUrl={sender?.memberAvatarUrl}
          />
        ) : (
          <View style={styles.avatarSpacer} />
        )}
      </View>
      <View style={styles.inboundContent}>
        {showSender && (
          <Text style={styles.senderName}>
            {sender?.memberUsername ?? message.senderId.slice(0, 8)}
          </Text>
        )}
        <View style={styles.inboundBubble}>
          <Text style={styles.inboundText}>{message.content}</Text>
        </View>
        <Text style={styles.inboundMeta}>{formatClock(message.sentAtMs)}</Text>
      </View>
    </View>
  );
}

function EmptyCircleState({
  onCreate,
  t,
}: {
  onCreate: () => void;
  t: FamilyChatTranslations;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="chatbubbles-outline" size={36} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{t.emptyCircleTitle}</Text>
      <Text style={styles.emptyBody}>{t.emptyCircleBody}</Text>
      <Pressable style={styles.emptyBtn} onPress={onCreate}>
        <Text style={styles.emptyBtnText}>{t.emptyCircleCta}</Text>
      </Pressable>
    </View>
  );
}

export default function FamilyChatScreen() {
  const router = useRouter();
  const t = useTranslation(familyChatLang);
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const {
    circles,
    selectedCircle,
    selectCircle,
    refreshCircles,
    isLoading: circleLoading,
  } = useFamilyCircle();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const familyCircleSheetRef = useRef<BottomSheetModal>(null);

  // Resolve current user id once
  useEffect(() => {
    getUserId()
      .then(setCurrentUserId)
      .catch(() => setCurrentUserId(null));
  }, []);

  const memberById = useMemo(() => {
    const map = new Map<string, MemberInfo>();
    members.forEach((m) => map.set(m.memberId, m));
    return map;
  }, [members]);

  const onlineCount = useMemo(
    () => members.filter((m) => m.online).length,
    [members],
  );

  // Load messages + members whenever the selected circle changes
  useEffect(() => {
    if (!selectedCircle) {
      setMessages([]);
      setMembers([]);
      return;
    }

    let cancelled = false;
    const circleId = selectedCircle.familyCircleId;
    const CHAT_CACHE_KEY = `@family_chat_${circleId}`;

    setLoadingMessages(true);
    setError(null);

    // Load from local storage cache first
    AsyncStorage.getItem(CHAT_CACHE_KEY)
      .then((cached) => {
        if (!cancelled && cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              setMessages((prev) => (prev.length === 0 ? parsed : prev));
            }
          } catch (e) {
            console.error("Failed to parse cached chat", e);
          }
        }
      })
      .catch((e) => console.error("Failed to read chat cache", e));

    Promise.all([
      listFamilyMessages(circleId, PAGE_SIZE),
      listFamilyCircleMembers(circleId),
    ])
      .then(([msgRes, memRes]) => {
        if (cancelled) return;
        // Server may return newest-first; render oldest-first.
        const sorted = msgRes.messagesList
          .map<ChatMessage>((m) => ({
            messageId: m.messageId,
            senderId: m.senderId,
            content: m.messageContent,
            sentAtMs: m.sentAtMs,
          }))
          .sort((a, b) => a.sentAtMs - b.sentAtMs);
        setMessages(sorted);
        setMembers(memRes.membersList);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load chat:", err);
        setError(t.loadError || "Failed to load messages");
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCircle]);

  // Save to cache whenever messages change
  useEffect(() => {
    if (!selectedCircle || messages.length === 0) return;
    const CHAT_CACHE_KEY = `@family_chat_${selectedCircle.familyCircleId}`;
    AsyncStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(messages)).catch(
      (err) => console.error("Failed to save chat cache", err),
    );
  }, [messages, selectedCircle]);

  // Tell the persistent stream hook whether this tab is focused so it can
  // decide whether to show a notification and increment the unread badge.
  useFocusEffect(
    useCallback(() => {
      DeviceEventEmitter.emit(CHAT_FOCUS_EVENT, { focused: true });
      return () => {
        DeviceEventEmitter.emit(CHAT_FOCUS_EVENT, { focused: false });
      };
    }, []),
  );

  // Notify the persistent stream hook whenever the selected circle changes so
  // it can restart the gRPC stream for the new circle.
  useEffect(() => {
    DeviceEventEmitter.emit(CHAT_CIRCLE_CHANGED_EVENT, {
      circleId: selectedCircle?.familyCircleId ?? null,
    });
  }, [selectedCircle]);

  // Append live messages delivered by the persistent stream hook.
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      CHAT_NEW_MESSAGE_EVENT,
      (msg: ProtoMessage.AsObject) => {
        setMessages((prev) => {
          if (prev.some((m) => m.messageId === msg.messageId)) return prev;
          return [
            ...prev,
            {
              messageId: msg.messageId,
              senderId: msg.senderId,
              content: msg.messageContent,
              sentAtMs: msg.sentAtMs,
            },
          ];
        });
      },
    );
    return () => sub.remove();
  }, []);

  // Auto-scroll to bottom when message list grows
  useEffect(() => {
    if (messages.length === 0) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !selectedCircle || sending) return;
    setSending(true);
    try {
      const res = await sendFamilyMessage(selectedCircle.familyCircleId, text);
      // Optimistically append (the stream will dedupe by messageId).
      if (currentUserId) {
        setMessages((prev) => {
          if (prev.some((m) => m.messageId === res.messageId)) return prev;
          return [
            ...prev,
            {
              messageId: res.messageId,
              senderId: currentUserId,
              content: text,
              sentAtMs: res.sentAtMs || Date.now(),
            },
          ];
        });
      }
      setInputText("");
    } catch (err) {
      console.error("Send failed:", err);
    } finally {
      setSending(false);
    }
  }, [inputText, selectedCircle, sending, currentUserId]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.3}
        pressBehavior="close"
        style={[props.style, { bottom: tabBarHeight }]}
      />
    ),
    [tabBarHeight],
  );

  const handleFamilyCircleModalPress = useCallback(() => {
    familyCircleSheetRef.current?.present();
  }, []);

  const handleSelectFamilyCircle = useCallback(
    (circle: FamilyCircle) => {
      selectCircle(circle);
      familyCircleSheetRef.current?.dismiss();
    },
    [selectCircle],
  );

  const handleAddFamilyCircle = useCallback(() => {
    familyCircleSheetRef.current?.dismiss();
    setTimeout(() => {
      router.push("/family-circles/new");
    }, 200);
  }, [router]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (circleLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedCircle) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <EmptyCircleState
          onCreate={() => router.push("/(app)/family-circles" as any)}
          t={t}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <View style={styles.circleHeader}>
        <View style={{ flex: 1 }}>
          <Pressable
            style={styles.circleTitleButton}
            onPress={handleFamilyCircleModalPress}
            hitSlop={8}
          >
            <Text style={styles.circleTitle} numberOfLines={1}>
              {selectedCircle.name}
            </Text>
            <Ionicons
              name="chevron-down"
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
          <View style={styles.circleStatus}>
            <View
              style={[
                styles.onlineDot,
                {
                  backgroundColor:
                    onlineCount > 0 ? "#22c55e" : colors.textMuted,
                },
              ]}
            />
            <Text style={styles.circleSubtitle}>
              {members.length} {members.length === 1 ? t.member : t.members}
              {onlineCount > 0 ? ` · ${onlineCount} ${t.online}` : ""}
            </Text>
          </View>
        </View>
        {members.length > 0 && <AvatarStack members={members} />}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : tabBarHeight}
      >
        {loadingMessages && messages.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error && messages.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyMsg}>{t.emptyMessages || "No messages yet"}</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.messageId}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: false })
            }
            ListHeaderComponent={
              messages.length > 0 ? (
                <View style={styles.dividerRow}>
                  <Text style={styles.dividerText}>
                    {formatDayLabel(messages[0].sentAtMs, t.today)}
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item, index }) => {
              const isMe = currentUserId === item.senderId;
              const prev = index > 0 ? messages[index - 1] : null;
              const showSender =
                !isMe && (!prev || prev.senderId !== item.senderId);
              return (
                <ChatBubble
                  message={item}
                  isMe={isMe}
                  sender={memberById.get(item.senderId)}
                  showSender={showSender}
                />
              );
            }}
          />
        )}

        <View style={styles.inputBar}>
          <Pressable style={styles.attachBtn} hitSlop={8} disabled>
            <Ionicons
              name="attach-outline"
              size={22}
              color={colors.textMuted}
            />
          </Pressable>
          <TextInput
            style={styles.textInput}
            placeholder={t.messagePlaceholder.replace(
              "{circle}",
              selectedCircle.name,
            )}
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!sending}
          />
          <Pressable
            style={[
              styles.sendBtn,
              (!inputText.trim() || sending) && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <FamilyCircleListSheet
        familyCircleSheetRef={familyCircleSheetRef}
        renderBackdrop={renderBackdrop}
        selectedCircle={selectedCircle}
        handleSelectFamilyCircle={handleSelectFamilyCircle}
        familyCircles={circles}
        onRefresh={refreshCircles}
        onAddFamilyCircle={handleAddFamilyCircle}
        tabBarHeight={tabBarHeight}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7fa" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  errorText: { color: colors.danger, textAlign: "center" },
  emptyMsg: { color: colors.textMuted, textAlign: "center", fontSize: 13 },

  circleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#edf2f7",
  },
  circleTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    flexShrink: 1,
  },
  circleTitleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  circleStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  circleSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Avatar stack
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  stackAvatarWrap: {
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 17,
  },
  stackOverflow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stackOverflowText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  // Message list
  messageList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: 4,
  },
  dividerRow: {
    alignItems: "center",
    marginVertical: spacing.md,
  },
  dividerText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "500",
  },

  // Inbound
  inboundGroup: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: spacing.md,
  },
  inboundAvatar: {
    width: 34,
    alignItems: "center",
  },
  avatarSpacer: {
    width: 34,
    height: 34,
  },
  inboundContent: {
    flex: 1,
    maxWidth: "80%",
    gap: 3,
  },
  senderName: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    marginLeft: 2,
  },
  inboundBubble: {
    backgroundColor: "#fff",
    borderRadius: radii.lg,
    borderBottomLeftRadius: 4,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#edf2f7",
    alignSelf: "flex-start",
  },
  inboundText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  inboundMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 2,
  },

  // Outbound
  outboundRow: {
    alignItems: "flex-end",
    marginBottom: spacing.md,
    gap: 3,
  },
  outboundBubble: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    borderBottomRightRadius: 4,
    padding: spacing.md,
    maxWidth: "80%",
  },
  outboundText: {
    fontSize: 14,
    color: "#fff",
    lineHeight: 20,
  },
  outboundMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginRight: 2,
  },

  // Avatar
  avatar: {
    backgroundColor: colors.primaryLight,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    color: "#fff",
    fontWeight: "700",
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  emptyBody: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
  },
  emptyBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
  },
  emptyBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#edf2f7",
  },
  attachBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: "#f5f7fa",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: colors.primary + "60",
  },
});
