import { AppNotification, useNotifications } from "@/hooks/useNotifications";
import { colors, radii, spacing } from "@/styles/styles";
import { formatTimeAgo } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

// ─── Notification Card ────────────────────────────────────────────────────────

function TrackingNotificationCard({
  item,
  onDelete,
}: {
  item: AppNotification;
  onDelete: (id: string) => void;
}) {
  const icon = getTrackingIcon(item.title);
  return (
    <View style={styles.notifCard}>
      <View style={[styles.notifIconCircle, { backgroundColor: colors.primary + "20" }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.notifBody}>
        <View style={styles.notifTitleRow}>
          <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.notifTime}>{formatTimeAgo(item.createdAtMs)}</Text>
        </View>
        <Text style={styles.notifContent} numberOfLines={3}>{item.content}</Text>
      </View>
      <Pressable onPress={() => onDelete(item.id)} hitSlop={8} style={styles.deleteBtn}>
        <Ionicons name="close" size={15} color="#b0b8c1" />
      </Pressable>
    </View>
  );
}

function RiskNotificationCard({
  item,
  onDelete,
}: {
  item: AppNotification;
  onDelete: (id: string) => void;
}) {
  return (
    <View style={[styles.notifCard, styles.riskCard]}>
      <View style={[styles.notifIconCircle, { backgroundColor: "#fde8e8" }]}>
        <Ionicons name="alert-circle" size={20} color={colors.danger} />
      </View>
      <View style={styles.notifBody}>
        <View style={styles.notifTitleRow}>
          <Text style={[styles.notifTitle, { color: colors.danger }]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentText}>URGENT</Text>
          </View>
        </View>
        <Text style={[styles.notifContent, { color: colors.danger + "cc" }]} numberOfLines={3}>
          {item.content}
        </Text>
      </View>
      <Pressable onPress={() => onDelete(item.id)} hitSlop={8} style={styles.deleteBtn}>
        <Ionicons name="close" size={15} color="#b0b8c1" />
      </Pressable>
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ label, onMarkAll }: { label: string; onMarkAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {onMarkAll && (
        <Pressable onPress={onMarkAll} hitSlop={8}>
          <Text style={styles.markAllText}>Mark all as read</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Weekly Summary Card ──────────────────────────────────────────────────────

function WeeklySummaryCard() {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Weekly Summary</Text>
      <Text style={styles.summaryBody}>
        All family members stayed within designated safe zones 98% of the time.
      </Text>
      <Pressable style={styles.summaryBtn}>
        <Text style={styles.summaryBtnText}>View Report</Text>
      </Pressable>
    </View>
  );
}

// ─── Stats Row ────────────────────────────────────────────────────────────────

function StatsRow({ activeZones, networkStatus }: { activeZones: number; networkStatus: string }) {
  return (
    <View style={styles.statsRow}>
      <View style={styles.statCard}>
        <Ionicons name="map" size={22} color={colors.primary} />
        <Text style={styles.statValue}>{activeZones}</Text>
        <Text style={styles.statLabel}>Active Zones</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
        <Text style={styles.statValue}>{networkStatus}</Text>
        <Text style={styles.statLabel}>Network Status</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
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

  const [tabIndex, setTabIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Tab switching ──────────────────────────────────────────────────────────

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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable
          onPress={clearAll}
          style={styles.headerBtn}
          hitSlop={8}
        >
          <Ionicons name="ellipsis-vertical" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBarWrap}>
        <View style={styles.tabBarInner}>
          {["Tracking", "Risk"].map((label, i) => (
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
          { useNativeDriver: false }
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
                <>
                  <SectionHeader
                    label="TODAY"
                    onMarkAll={() => clearTrackingTab(trackingNotifications.map((n) => n.id))}
                  />
                </>
              }
              renderItem={({ item }) => (
                <TrackingNotificationCard item={item} onDelete={deleteTracking} />
              )}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyText}>No tracking notifications</Text>
                </View>
              }
              // ListFooterComponent={
              //   <>
              //     <WeeklySummaryCard />
              //     <StatsRow activeZones={12} networkStatus="Secure" />
              //     <View style={{ height: 32 }} />
              //   </>
              // }
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
                    label="RECENT HIGH PRIORITY"
                    onMarkAll={() => clearRiskTab(riskNotifications.map((n) => n.id))}
                  />
                ) : null
              }
              renderItem={({ item }) => (
                <RiskNotificationCard item={item} onDelete={deleteRisk} />
              )}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Ionicons name="shield-checkmark-outline" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyText}>No risk alerts</Text>
                </View>
              }
              // ListFooterComponent={
              //   <>
              //     <WeeklySummaryCard />
              //     <StatsRow activeZones={12} networkStatus="Secure" />
              //     <View style={{ height: 32 }} />
              //   </>
              // }
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

  // Header
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

  // Tab bar
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

  // Pages
  page: { width: SCREEN_WIDTH, flex: 1 },
  listContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md },

  // Section header
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

  // Notification card
  notifCard: {
    backgroundColor: "#fff",
    borderRadius: radii.lg,
    marginBottom: 12,
    padding: spacing.md,
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
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
  },
  notifTime: { fontSize: 11, color: colors.textMuted, flexShrink: 0 },
  notifContent: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  urgentBadge: {
    backgroundColor: colors.danger + "18",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  urgentText: { fontSize: 10, fontWeight: "800", color: colors.danger, letterSpacing: 0.5 },
  deleteBtn: { padding: 4, marginTop: 2 },

  // Weekly summary
  summaryCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: 12,
    gap: spacing.sm,
  },
  summaryTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  summaryBody: { fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 20 },
  summaryBtn: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  summaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Stats
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: "flex-start",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: { fontSize: 26, fontWeight: "800", color: colors.textPrimary, marginTop: 4 },
  statLabel: { fontSize: 12, color: colors.textMuted },

  // Empty
  emptyWrap: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: { fontSize: 15, color: colors.textSecondary },
});
