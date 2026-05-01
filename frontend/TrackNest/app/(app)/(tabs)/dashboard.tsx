import { dashboard as dashboardLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { criminalReportsService } from "@/services/criminalReports";
import type { DashboardSummaryResponse } from "@/types/criminalReports";
import { colors, radii, spacing } from "@/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

type DashboardTranslations = ReturnType<typeof useTranslation<typeof dashboardLang>>;
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Stat Grid ───────────────────────────────────────────────────────────────

function StatGrid({ data, t }: { data: DashboardSummaryResponse; t: DashboardTranslations }) {
  const stats = [
    { label: t.totalIncidents, value: data.crimeStats.total, color: colors.primary },
    { label: t.active, value: data.crimeStats.active, color: colors.danger, dot: true },
    { label: t.investigating, value: data.crimeStats.investigating, color: colors.textPrimary },
    { label: t.resolved, value: data.crimeStats.resolved, color: colors.textPrimary },
  ];
  return (
    <View style={styles.statGrid}>
      {stats.map((s) => (
        <View key={s.label} style={styles.statCard}>
          <Text style={styles.statLabel}>{s.label}</Text>
          <View style={styles.statValueRow}>
            {s.dot && <View style={styles.statDot} />}
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Vertical Bar Chart ───────────────────────────────────────────────────────

function VerticalBarChart({
  data,
  t,
}: {
  data: Array<{ dayName: string; crimes: number; missing: number }>;
  t: DashboardTranslations;
}) {
  const maxVal = Math.max(...data.map((d) => d.crimes + d.missing), 1);
  const BAR_MAX_HEIGHT = 80;

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.sectionTitle}>{t.weeklyTrend}</Text>
        <Text style={styles.chartSubLabel}>{t.last7Days}</Text>
      </View>
      <View style={styles.barsRow}>
        {data.map((day, i) => {
          const combined = day.crimes + day.missing;
          const barHeight = Math.max(4, (combined / maxVal) * BAR_MAX_HEIGHT);
          const isPeak = combined === Math.max(...data.map((d) => d.crimes + d.missing));
          return (
            <View key={i} style={styles.barCol}>
              <View style={[styles.barTrack, { height: BAR_MAX_HEIGHT }]}>
                <View style={styles.barTrackFill} />
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: isPeak ? colors.danger : colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>
                {day.dayName.slice(0, 3).toUpperCase()}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Severity Breakdown ───────────────────────────────────────────────────────

function SeverityBreakdown({ data, t }: { data: DashboardSummaryResponse; t: DashboardTranslations }) {
  const total = data.crimeStats.total || 1;
  const critical = data.severityGroups.find((g) =>
    g.name.toLowerCase().includes("critical"),
  )?.value ?? Math.round(total * 0.12);
  const high = data.severityGroups.find((g) =>
    g.name.toLowerCase() === "high",
  )?.value ?? Math.round(total * 0.26);
  const medLow = total - critical - high;

  const segments = [
    { label: t.severityCritical, value: critical, color: colors.danger },
    { label: t.severityHigh, value: high, color: colors.primary },
    { label: t.severityMediumLow, value: medLow, color: "#b2dce8" },
  ];

  return (
    <View style={styles.chartCard}>
      <Text style={styles.sectionTitle}>{t.severityBreakdown}</Text>
      <View style={styles.donutWrap}>
        <View style={styles.donutOuter}>
          <View style={styles.donutInner}>
            <Text style={styles.donutCount}>{data.crimeStats.active}</Text>
            <Text style={styles.donutCountLabel}>{t.activeCases}</Text>
          </View>
        </View>
      </View>
      <View style={styles.legendList}>
        {segments.map((s) => {
          const pct = Math.round((s.value / total) * 100);
          return (
            <View key={s.label} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: s.color }]} />
              <Text style={styles.legendLabel}>{s.label}</Text>
              <Text style={styles.legendPct}>{pct}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Recent Activity Item ─────────────────────────────────────────────────────

type ActivityItem = {
  id: string;
  title: string;
  timeAgo: string;
  description: string;
  severity: string;
  status: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
};

function RecentActivityItem({ item, t }: { item: ActivityItem; t: DashboardTranslations }) {
  const severityColor =
    item.severity === t.severityCritical
      ? colors.danger
      : item.severity === t.severityHigh
        ? colors.warn
        : colors.primary;

  const statusBg =
    item.status === t.active
      ? colors.primary
      : item.status === t.investigating
        ? "#e8f0fe"
        : "#f0fdf4";

  const statusColor =
    item.status === t.active
      ? "#fff"
      : item.status === t.investigating
        ? "#1d4ed8"
        : "#16a34a";

  return (
    <View style={styles.activityItem}>
      <View style={[styles.activityIcon, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon} size={18} color={item.iconColor} />
      </View>
      <View style={styles.activityBody}>
        <View style={styles.activityTitleRow}>
          <Text style={styles.activityTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.activityTime}>{item.timeAgo}</Text>
        </View>
        <Text style={styles.activityDesc} numberOfLines={3}>
          {item.description}
        </Text>
        <View style={styles.activityTags}>
          <View style={[styles.chip, { backgroundColor: severityColor + "20", borderColor: severityColor + "40" }]}>
            <Text style={[styles.chipText, { color: severityColor }]}>
              {item.severity} {t.severitySuffix}
            </Text>
          </View>
          <View style={[styles.chip, { backgroundColor: statusBg, borderColor: "transparent" }]}>
            <Text style={[styles.chipText, { color: statusColor }]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

function buildRecentActivity(
  data: DashboardSummaryResponse,
  t: DashboardTranslations,
): ActivityItem[] {
  const icons: Array<{ icon: keyof typeof Ionicons.glyphMap; iconBg: string; iconColor: string }> = [
    { icon: "warning", iconBg: "#fde8e8", iconColor: colors.danger },
    { icon: "search", iconBg: "#e8f0fe", iconColor: "#3b82f6" },
    { icon: "checkmark-circle", iconBg: "#e8fdf0", iconColor: "#16a34a" },
  ];

  const severities = [t.severityCritical, t.severityHigh, "Low"];
  const statuses = [t.active, t.investigating, t.resolved];

  return data.crimeByType.slice(0, 3).map((item, i) => ({
    id: String(i),
    title: item.name,
    timeAgo:
      i === 0
        ? `10 ${t.minAgo}`
        : i === 1
          ? `45 ${t.minAgo}`
          : `2 ${t.hoursAgo}`,
    description: `${item.value} ${t.reportedIncidents}`,
    severity: severities[i % 3],
    status: statuses[i % 3],
    ...icons[i % 3],
  }));
}

export default function DashboardScreen() {
  const router = useRouter();
  const t = useTranslation(dashboardLang);
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await criminalReportsService.getDashboardSummary();
        setData(res);
      } catch {
        setError(t.errorLoad);
      } finally {
        setLoading(false);
      }
    })();
  }, [t.errorLoad]);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? t.noData}</Text>
          <Pressable
            style={styles.retryBtn}
            onPress={() => {
              setError(null);
              setLoading(true);
              criminalReportsService
                .getDashboardSummary()
                .then(setData)
                .catch(() => setError(t.errorLoad))
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryText}>{t.retry}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const recentActivity = buildRecentActivity(data, t);

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>{t.pageTitle}</Text>
        <Text style={styles.pageSubtitle}>{t.pageSubtitle}</Text>

        <StatGrid data={data} t={t} />

        {data.weeklyTrend.length > 0 && (
          <VerticalBarChart data={data.weeklyTrend} t={t} />
        )}

        <SeverityBreakdown data={data} t={t} />

        {recentActivity.length > 0 && (
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.sectionTitle}>{t.recentActivity}</Text>
              <Pressable onPress={() => router.push("/(app)/crime-dashboard" as any)} hitSlop={8}>
                <Text style={styles.viewAllText}>{t.viewAll}</Text>
              </Pressable>
            </View>
            {recentActivity.map((item) => (
              <RecentActivityItem key={item.id} item={item} t={t} />
            ))}
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7fa" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  pageTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: spacing.lg,
  },

  // Stat grid
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#fff",
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#edf2f7",
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
  },

  // Charts shared
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  chartSubLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  viewAllText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },

  // Vertical bar chart
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 4,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  barTrack: {
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    position: "relative",
  },
  barTrackFill: {
    position: "absolute",
    left: "15%",
    right: "15%",
    top: 0,
    bottom: 0,
    backgroundColor: "#e6eef2",
    borderRadius: 4,
  },
  bar: {
    width: "70%",
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "600",
  },

  // Donut
  donutWrap: {
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  donutOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 18,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  donutInner: {
    alignItems: "center",
  },
  donutCount: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  donutCountLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  legendList: {
    gap: 10,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
  },
  legendPct: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },

  // Activity feed
  activityItem: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  activityBody: {
    flex: 1,
    gap: 4,
  },
  activityTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  activityTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  activityTime: {
    fontSize: 11,
    color: colors.textMuted,
    flexShrink: 0,
  },
  activityDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  activityTags: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "600",
  },

  errorText: { color: colors.danger, marginBottom: 12 },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
  },
  retryText: { color: "#fff", fontWeight: "600" },
});
