import { NOTIFICATIONS_LAST_VIEWED_KEY } from "@/constant";
import { notifications as notificationsLang } from "@/constant/languages";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { AppNotification, useNotifications } from "@/hooks/useNotifications";
import { useTranslation } from "@/hooks/useTranslation";
import { colors, radii, spacing } from "@/styles/styles";
import { formatTimeAgo } from "@/utils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Unread helpers ───────────────────────────────────────────────────────────

/** Returns true if the notification arrived after the user's last screen visit. */
function isUnread(item: AppNotification, lastViewedMs: number): boolean {
  return item.createdAtMs > lastViewedMs;
}

// ─── Notification icon helpers ────────────────────────────────────────────────

const TRACKING_ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  arrived: "home",
  battery: "battery-half",
  driving: "speedometer",
  default: "location",
};

function getTrackingIcon(title: string): React.ComponentProps<typeof Ionicons>["name"] {
  const lower = title.toLowerCase();
  if (lower.includes("arriv") || lower.includes("home") || lower.includes("zone")) return TRACKING_ICONS.arrived;
  if (lower.includes("battery")) return TRACKING_ICONS.battery;
  if (lower.includes("driv") || lower.includes("speed") || lower.includes("mph") || lower.includes("km")) return TRACKING_ICONS.driving;
  return TRACKING_ICONS.default;
}

// ─── Notification Cards ───────────────────────────────────────────────────────

function TrackingNotificationCard({
  item,
  onDelete,
  unread,
  newBadgeLabel,
}: {
  item: AppNotification;
  onDelete: (id: string) => void;
  unread: boolean;
  newBadgeLabel: string;
}) {
  const icon = getTrackingIcon(item.title);
  return (
    <View style={[styles.notifCard, unread && styles.notifCardUnread]}>
      {/* Unread indicator strip */}
      {/* {unread && <View style={styles.unreadStrip} />} */}

      <View style={[styles.notifIconCircle, { backgroundColor: colors.primary + "20" }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>

      <View style={styles.notifBody}>
        <View style={styles.notifTitleRow}>
          <Text
            style={[styles.notifTitle, unread && styles.notifTitleUnread]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <View style={styles.notifRightMeta}>
            {/* {unread && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>{newBadgeLabel}</Text>
              </View>
            )} */}
            <Text style={styles.notifTime}>{formatTimeAgo(item.createdAtMs)}</Text>
          </View>
        </View>
        <Text style={styles.notifContent} numberOfLines={3}>{item.content}</Text>
        {item.memberUsername ? (
          <Text style={styles.notifMember}>{item.memberUsername}</Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => onDelete(item.id)}
        hitSlop={8}
        style={styles.deleteBtn}
        accessibilityLabel="Delete notification"
      >
        <Ionicons name="close" size={15} color="#b0b8c1" />
      </Pressable>
    </View>
  );
}

function RiskNotificationCard({
  item,
  onDelete,
  unread,
  urgentLabel,
  newBadgeLabel,
}: {
  item: AppNotification;
  onDelete: (id: string) => void;
  unread: boolean;
  urgentLabel: string;
  newBadgeLabel: string;
}) {
  return (
    <View style={[styles.notifCard, styles.riskCard, unread && styles.notifCardUnread]}>
      {unread && <View style={[styles.unreadStrip, { backgroundColor: colors.danger }]} />}

      <View style={[styles.notifIconCircle, { backgroundColor: "#fde8e8" }]}>
        <Ionicons name="alert-circle" size={20} color={colors.danger} />
      </View>

      <View style={styles.notifBody}>
        <View style={styles.notifTitleRow}>
          <Text
            style={[styles.notifTitle, { color: colors.danger }, unread && styles.notifTitleUnread]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <View style={styles.notifRightMeta}>
            {unread && (
              <View style={[styles.newBadge, { backgroundColor: colors.danger + "18" }]}>
                <Text style={[styles.newBadgeText, { color: colors.danger }]}>{newBadgeLabel}</Text>
              </View>
            )}
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>{urgentLabel}</Text>
            </View>
          </View>
        </View>
        <Text style={[styles.notifContent, { color: colors.danger + "cc" }]} numberOfLines={3}>
          {item.content}
        </Text>
        {item.memberUsername ? (
          <Text style={styles.notifMember}>{item.memberUsername}</Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => onDelete(item.id)}
        hitSlop={8}
        style={styles.deleteBtn}
        accessibilityLabel="Delete notification"
      >
        <Ionicons name="close" size={15} color="#b0b8c1" />
      </Pressable>
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ label, onMarkAll, markAllLabel }: {
  label: string;
  markAllLabel: string;
  onMarkAll?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {onMarkAll && (
        <Pressable onPress={onMarkAll} hitSlop={8}>
          <Text style={styles.markAllText}>{markAllLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const t = useTranslation(notificationsLang);
  const { markAllRead, unreadCount } = useNotificationContext();
  const {
    trackingNotifications,
    riskNotifications,
    loading,
    fetchAll,
    clearAll,
    clearTrackingTab,
    clearRiskTab,
    deleteTracking,
    deleteRisk,
  } = useNotifications();

  // Timestamp of the last time this screen was viewed. Notifications that
  // arrived after this timestamp are highlighted as "new" / unread.
  const [lastViewedMs, setLastViewedMs] = useState<number>(Date.now());

  // On focus: read the persisted last-viewed timestamp BEFORE updating it, so
  // we can still show the "new" indicator for items that arrived since the
  // previous visit. Then immediately update the timestamp so that on the next
  // visit those same items will no longer be highlighted.
  useFocusEffect(
    useCallback(() => {
      // Always refresh the list on focus so items that arrived while the app
      // was backgrounded (and the JS background task didn't run) are shown
      // immediately without the user needing to tap the notification.
      fetchAll();
      markAllRead();

      AsyncStorage.getItem(NOTIFICATIONS_LAST_VIEWED_KEY)
        .then((stored) => {
          const prev = parseInt(stored ?? "0", 10) || 0;
          setLastViewedMs(prev);
          // Update the stored value to now so next visit marks these as read.
          AsyncStorage.setItem(NOTIFICATIONS_LAST_VIEWED_KEY, String(Date.now())).catch(() => {});
        })
        .catch(() => setLastViewedMs(0));
    }, [markAllRead, fetchAll]),
  );

  const [tabIndex, setTabIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Re-fetch page 1 whenever the badge count bumps so new items appear without
  // the user needing to leave and re-enter the screen.
  useEffect(() => {
    fetchAll();
  }, [fetchAll, unreadCount]);

  const goToTab = (index: number) => {
    setTabIndex(index);
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (newIndex !== tabIndex) setTabIndex(newIndex);
  };

  const indicatorLeft = scrollX.interpolate({
    inputRange: [0, SCREEN_WIDTH],
    outputRange: [0, SCREEN_WIDTH / 2],
    extrapolate: "clamp",
  });
  const indicatorWidth = SCREEN_WIDTH / 2;

  const tabLabels = [t.tabTracking, t.tabRisk];

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t.headerTitle}</Text>
        <Pressable onPress={clearAll} style={styles.headerBtn} hitSlop={8}>
          <Ionicons name="ellipsis-vertical" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBarWrap}>
        <View style={styles.tabBarInner}>
          {tabLabels.map((label, i) => (
            <Pressable key={label} style={styles.tabBtn} onPress={() => goToTab(i)}>
              <Text style={[styles.tabText, tabIndex === i && styles.tabTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Animated.View style={[styles.tabIndicator, { width: indicatorWidth, left: indicatorLeft }]} />
      </View>

      {/* Swipeable content */}
      <Animated.ScrollView
        ref={scrollRef as any}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        onMomentumScrollEnd={onScrollEnd}
        style={{ flex: 1 }}
      >
        {/* ── Tracking page ── */}
        <View style={styles.page}>
          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
          ) : (
            <FlatList
              data={trackingNotifications}
              keyExtractor={(n) => n.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={
                <SectionHeader
                  label={t.todaySection}
                  markAllLabel={t.markAllAsRead}
                  onMarkAll={() => clearTrackingTab(trackingNotifications.map((n) => n.id))}
                />
              }
              renderItem={({ item }) => (
                <TrackingNotificationCard
                  item={item}
                  onDelete={deleteTracking}
                  unread={isUnread(item, lastViewedMs)}
                  newBadgeLabel={t.newBadge}
                />
              )}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyText}>{t.emptyStateTracking}</Text>
                </View>
              }
            />
          )}
        </View>

        {/* ── Risk page ── */}
        <View style={styles.page}>
          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
          ) : (
            <FlatList
              data={riskNotifications}
              keyExtractor={(n) => n.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={
                riskNotifications.length > 0 ? (
                  <SectionHeader
                    label={t.recentHighPrioritySection}
                    markAllLabel={t.markAllAsRead}
                    onMarkAll={() => clearRiskTab(riskNotifications.map((n) => n.id))}
                  />
                ) : null
              }
              renderItem={({ item }) => (
                <RiskNotificationCard
                  item={item}
                  onDelete={deleteRisk}
                  unread={isUnread(item, lastViewedMs)}
                  urgentLabel={t.urgentBadge}
                  newBadgeLabel={t.newBadge}
                />
              )}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Ionicons name="shield-checkmark-outline" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyText}>{t.emptyStateRisk}</Text>
                </View>
              }
            />
          )}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7fa" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },

  tabBarWrap: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8edf3",
    position: "relative",
  },
  tabBarInner: { flexDirection: "row" },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 14 },
  tabText: { fontSize: 15, fontWeight: "500", color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: "700" },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    height: 3,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  page: { width: SCREEN_WIDTH, flex: 1 },
  listContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 32 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  markAllText: { fontSize: 13, color: colors.primary, fontWeight: "600" },

  // ── Notification card ──
  notifCard: {
    backgroundColor: "#fff",
    borderRadius: radii.lg,
    marginBottom: 12,
    padding: spacing.md,
    paddingLeft: spacing.md + 4, // extra left padding for the unread strip space
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    position: "relative",
  },
  notifCardUnread: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  // Left-edge colored strip shown only on unread cards
  unreadStrip: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary,
    borderTopLeftRadius: radii.lg,
    borderBottomLeftRadius: radii.lg,
  },
  riskCard: {
    borderColor: colors.danger + "30",
    backgroundColor: "#fff9f9",
  },
  notifIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  notifBody: { flex: 1 },
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },
  notifTitleUnread: {
    fontWeight: "700",
  },
  notifRightMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  notifTime: { fontSize: 11, color: colors.textMuted },
  notifContent: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  notifMember: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    fontStyle: "italic",
  },
  newBadge: {
    backgroundColor: colors.primary + "18",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.4,
  },
  urgentBadge: {
    backgroundColor: colors.danger + "18",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  urgentText: { fontSize: 10, fontWeight: "800", color: colors.danger, letterSpacing: 0.5 },
  deleteBtn: { padding: 4, marginTop: 2 },

  emptyWrap: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: colors.textSecondary },
});
