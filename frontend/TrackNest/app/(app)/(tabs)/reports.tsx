import { reports as reportsLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import {
  fetchGuides,
  fetchMissingPersons,
  fetchReports,
  type Guide,
  type MissingPerson,
  type Report,
} from "@/utils/reportAdapters";
import { colors, radii, spacing } from "@/styles/styles";
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
const TAB_KEYS = ["Crime Reports", "Missing", "Guide"] as const;
type TabKey = (typeof TAB_KEYS)[number];

// ─── Severity Badge ───────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const color =
    severity === "High"
      ? colors.danger
      : severity === "Medium"
        ? colors.warn
        : "#22c55e";
  return (
    <View style={[styles.severityBadge, { borderColor: color + "60", backgroundColor: color + "18" }]}>
      <View style={[styles.severityDot, { backgroundColor: color }]} />
      <Text style={[styles.severityText, { color }]}>{severity.toUpperCase()}</Text>
    </View>
  );
}

// ─── Report Card ──────────────────────────────────────────────────────────────

function ReportCard({ item }: { item: Report }) {
  const router = useRouter();
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/report-detail?id=${item.id}`)}
    >
      <View style={styles.cardImageArea}>
        <View style={styles.cardImagePlaceholder}>
          <Ionicons name="warning-outline" size={40} color={colors.danger + "60"} />
        </View>
        <View style={styles.cardBadgeOverlay}>
          <SeverityBadge severity={item.severity} />
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.cardMetaRow}>
          <Ionicons name="location-outline" size={13} color={colors.textMuted} />
          <Text style={styles.cardMetaText} numberOfLines={1}>{item.address}</Text>
        </View>
        <View style={styles.cardMetaRow}>
          <Ionicons name="time-outline" size={13} color={colors.textMuted} />
          <Text style={styles.cardMetaText}>{item.date}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Missing Person Card ──────────────────────────────────────────────────────

function MissingPersonCard({
  item,
  ageLabel,
  yearsOldLabel,
  lastSeenLabel,
}: {
  item: MissingPerson;
  ageLabel: string;
  yearsOldLabel: string;
  lastSeenLabel: string;
}) {
  const router = useRouter();
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/missing-detail?id=${item.id}`)}
    >
      <View style={styles.cardImageArea}>
        <View style={[styles.cardImagePlaceholder, { backgroundColor: "#fef2f2" }]}>
          <Ionicons name="person-outline" size={40} color={colors.danger + "60"} />
        </View>
        <View style={styles.cardBadgeOverlay}>
          <SeverityBadge severity={item.severity} />
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
        <View style={styles.cardMetaRow}>
          <Ionicons name="person-outline" size={13} color={colors.textMuted} />
          <Text style={styles.cardMetaText}>
            {ageLabel}: {item.age} {yearsOldLabel}
          </Text>
        </View>
        <View style={styles.cardMetaRow}>
          <Ionicons name="location-outline" size={13} color={colors.textMuted} />
          <Text style={styles.cardMetaText} numberOfLines={1}>
            {lastSeenLabel}: {item.lastSeen}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Guide Card ───────────────────────────────────────────────────────────────

function GuideCard({
  item,
  categoryLabel,
}: {
  item: Guide;
  categoryLabel: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardImageArea}>
        <View style={[styles.cardImagePlaceholder, { backgroundColor: "#eff6ff" }]}>
          <Ionicons name="book-outline" size={40} color={colors.primary + "80"} />
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.cardMetaRow}>
          <Ionicons name="folder-outline" size={13} color={colors.textMuted} />
          <Text style={styles.cardMetaText}>
            {categoryLabel}: {item.category}
          </Text>
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.content}</Text>
      </View>
    </View>
  );
}

// ─── Tab Page (FlatList wrapper) ──────────────────────────────────────────────

function TabPage<T extends { id: string }>({
  data,
  renderItem,
  loading,
  refreshing,
  onRefresh,
  onEndReached,
  emptyTitle,
  emptySubtitle,
}: {
  data: T[];
  renderItem: ({ item }: { item: T }) => React.ReactElement | null;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onEndReached: () => void;
  emptyTitle: string;
  emptySubtitle: string;
}) {
  if (loading) {
    return (
      <View style={[styles.tabPage, styles.loadingWrap]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.tabPage}>
      <FlatList<T>
        data={data}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIllustrationContainer}>
              <View style={styles.emptyBlob1} />
              <View style={styles.emptyBlob2} />
              <Ionicons name="map" size={80} color="#b4dede" style={styles.emptyIconMap} />
              <Ionicons name="search" size={50} color={colors.primary} style={styles.emptyIconSearch} />
            </View>
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ReportsScreen() {
  const router = useRouter();
  const t = useTranslation(reportsLang);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "Crime Reports", label: t.tabCrimeReports },
    { key: "Missing", label: t.tabMissing },
    { key: "Guide", label: t.tabGuide },
  ];

  const [tabIndex, setTabIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Per-tab data state
  const [reports, setReports] = useState<Report[]>([]);
  const [missing, setMissing] = useState<MissingPerson[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [pages, setPages] = useState({ reports: 1, missing: 1, guides: 1 });
  const [loading, setLoading] = useState({ reports: true, missing: true, guides: true });
  const [refreshing, setRefreshing] = useState({ reports: false, missing: false, guides: false });

  // ── Load helpers ─────────────────────────────────────────────────────────────

  const loadReports = async (pageToLoad = 1) => {
    try {
      if (pageToLoad === 1) setLoading((p) => ({ ...p, reports: true }));
      const res = await fetchReports({ page: pageToLoad, perPage: 10 });
      setReports((prev) => (pageToLoad === 1 ? res.data : [...prev, ...res.data]));
      setPages((p) => ({ ...p, reports: res.page }));
    } catch (err) {
      console.error("fetchReports error", err);
    } finally {
      setLoading((p) => ({ ...p, reports: false }));
      setRefreshing((p) => ({ ...p, reports: false }));
    }
  };

  const loadMissing = async (pageToLoad = 1) => {
    try {
      if (pageToLoad === 1) setLoading((p) => ({ ...p, missing: true }));
      const res = await fetchMissingPersons({ page: pageToLoad, perPage: 10 });
      setMissing((prev) => (pageToLoad === 1 ? res.data : [...prev, ...res.data]));
      setPages((p) => ({ ...p, missing: res.page }));
    } catch (err) {
      console.error("fetchMissing error", err);
    } finally {
      setLoading((p) => ({ ...p, missing: false }));
      setRefreshing((p) => ({ ...p, missing: false }));
    }
  };

  const loadGuides = async (pageToLoad = 1) => {
    try {
      if (pageToLoad === 1) setLoading((p) => ({ ...p, guides: true }));
      const res = await fetchGuides({ page: pageToLoad, perPage: 10 });
      setGuides((prev) => (pageToLoad === 1 ? res.data : [...prev, ...res.data]));
      setPages((p) => ({ ...p, guides: res.page }));
    } catch (err) {
      console.error("fetchGuides error", err);
    } finally {
      setLoading((p) => ({ ...p, guides: false }));
      setRefreshing((p) => ({ ...p, guides: false }));
    }
  };

  // Load all tabs on mount
  useEffect(() => {
    loadReports(1);
    loadMissing(1);
    loadGuides(1);
  }, []);

  // ── Tab switching ─────────────────────────────────────────────────────────────

  const goToTab = (index: number) => {
    setTabIndex(index);
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (newIndex !== tabIndex) setTabIndex(newIndex);
  };

  // Animated indicator width and position
  const indicatorLeft = scrollX.interpolate({
    inputRange: tabs.map((_, i) => i * SCREEN_WIDTH),
    outputRange: tabs.map((_, i) => (i * SCREEN_WIDTH) / tabs.length),
    extrapolate: "clamp",
  });
  const TAB_BAR_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
  const indicatorWidth = TAB_BAR_WIDTH / tabs.length;

  const onCreateReport = () => {
    if (tabIndex === 0) router.push("/(app)/create-report" as any);
    else if (tabIndex === 1) router.push("/(app)/create-missing" as any);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
      {/* ── Tab Bar ── */}
      <View style={styles.tabBarWrap}>
        <View style={styles.tabBar}>
          {tabs.map((tabItem, i) => {
            const isActive = tabIndex === i;
            return (
              <Pressable
                key={tabItem.key}
                style={styles.tabBtn}
                onPress={() => goToTab(i)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tabItem.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {/* Animated underline indicator */}
        <Animated.View
          style={[
            styles.indicator,
            { width: indicatorWidth, left: indicatorLeft },
          ]}
        />
      </View>

      {/* ── Swipeable Pages ── */}
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
        {/* Page 0 — Crime Reports */}
        <TabPage<Report>
          data={reports}
          renderItem={({ item }) => <ReportCard item={item} />}
          loading={loading.reports}
          refreshing={refreshing.reports}
          onRefresh={() => {
            setRefreshing((p) => ({ ...p, reports: true }));
            loadReports(1);
          }}
          onEndReached={() => loadReports(pages.reports + 1)}
          emptyTitle={t.emptyTitleReports || "No reports found yet"}
          emptySubtitle={t.emptySubtitleReports || "Tap the button to create a new report."}
        />

        {/* Page 1 — Missing Persons */}
        <TabPage<MissingPerson>
          data={missing}
          renderItem={({ item }) => (
            <MissingPersonCard
              item={item}
              ageLabel={t.age}
              yearsOldLabel={t.yearsOld}
              lastSeenLabel={t.lastSeen}
            />
          )}
          loading={loading.missing}
          refreshing={refreshing.missing}
          onRefresh={() => {
            setRefreshing((p) => ({ ...p, missing: true }));
            loadMissing(1);
          }}
          onEndReached={() => loadMissing(pages.missing + 1)}
          emptyTitle={t.emptyTitleReports || "No reports found yet"}
          emptySubtitle={t.emptySubtitleReports || "Tap the button to create a new report."}
        />

        {/* Page 2 — Guidelines */}
        <TabPage<Guide>
          data={guides}
          renderItem={({ item }) => (
            <GuideCard item={item} categoryLabel={t.category} />
          )}
          loading={loading.guides}
          refreshing={refreshing.guides}
          onRefresh={() => {
            setRefreshing((p) => ({ ...p, guides: true }));
            loadGuides(1);
          }}
          onEndReached={() => loadGuides(pages.guides + 1)}
          emptyTitle={t.emptyTitleGuides || "No guides found yet"}
          emptySubtitle={t.emptySubtitleGuides || "Check back later for new guides."}
        />
      </Animated.ScrollView>

      {/* ── FAB ── */}
      {tabIndex !== 2 && (
        <Pressable style={styles.fab} onPress={onCreateReport}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.fabText}>{t.createReport}</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7fa" },

  // Tab bar
  tabBarWrap: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8edf3",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  tabBar: {
    flexDirection: "row",
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 12,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    height: 3,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  // Tab page
  tabPage: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  loadingWrap: { alignItems: "center", justifyContent: "center" },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: radii.lg,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#edf2f7",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardImageArea: {
    height: 160,
    position: "relative",
  },
  cardImagePlaceholder: {
    flex: 1,
    backgroundColor: "#f8f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBadgeOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
  },
  severityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  severityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  cardContent: {
    padding: spacing.md,
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    lineHeight: 20,
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cardMetaText: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: spacing.xl,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
    elevation: 5,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 16,
    paddingHorizontal: 20,
  },
  emptyIllustrationContainer: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyBlob1: {
    position: "absolute",
    width: 140,
    height: 120,
    backgroundColor: "#d8ecef",
    borderRadius: 60,
    transform: [{ rotate: "-15deg" }],
  },
  emptyBlob2: {
    position: "absolute",
    width: 100,
    height: 130,
    backgroundColor: "#e8f4f6",
    borderRadius: 50,
    transform: [{ rotate: "30deg" }],
    left: 10,
  },
  emptyIconMap: {
    position: "absolute",
    opacity: 0.9,
  },
  emptyIconSearch: {
    position: "absolute",
    bottom: 30,
    left: 30,
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
  },
  emptyTitle: {
    fontSize: 22,
    color: "#2d3748",
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#718096",
    textAlign: "center",
    marginTop: -4,
  },
});
