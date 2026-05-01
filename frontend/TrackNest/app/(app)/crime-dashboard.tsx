import { criminalReportsService } from "@/services/criminalReports";
import type { DashboardSummaryResponse } from "@/types/criminalReports";
import { crimeDashboard as crimeDashboardLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, color ? { color } : undefined]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function CrimeDashboardScreen() {
  const router = useRouter();
  const t = useTranslation(crimeDashboardLang);
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await criminalReportsService.getDashboardSummary();
        setData(res);
      } catch (e) {
        setError(t.errorLoad);
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [t.errorLoad]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={["top"]}>
        <ActivityIndicator size="large" color="#74becb" />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.center} edges={["top"]}>
        <Text style={styles.errorText}>{error ?? t.noData}</Text>
        <Pressable style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>{t.goBack}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Crime Stats */}
        <Text style={styles.sectionTitle}>{t.crimeReports}</Text>
        <View style={styles.statsRow}>
          <StatCard label={t.total} value={data.crimeStats.total} />
          <StatCard label={t.active} value={data.crimeStats.active} color="#ef4444" />
          <StatCard label={t.investigating} value={data.crimeStats.investigating} color="#f59e0b" />
          <StatCard label={t.resolved} value={data.crimeStats.resolved} color="#22c55e" />
        </View>

        {/* Missing Person Stats */}
        <Text style={styles.sectionTitle}>{t.missingPersons}</Text>
        <View style={styles.statsRow}>
          <StatCard label={t.total} value={data.missingPersonStats.total} />
          <StatCard label={t.pending} value={data.missingPersonStats.pending} color="#f59e0b" />
          <StatCard label={t.published} value={data.missingPersonStats.published} color="#3b82f6" />
          <StatCard label={t.rejected} value={data.missingPersonStats.rejected} color="#ef4444" />
        </View>

        {/* Guidelines + Reporters */}
        <Text style={styles.sectionTitle}>{t.otherStats}</Text>
        <View style={styles.statsRow}>
          <StatCard label={t.guidelines} value={data.guidelineStats.total} />
          <StatCard label={t.thisMonth} value={data.guidelineStats.thisMonth} color="#74becb" />
          <StatCard label={t.reporters} value={data.reporterStats.totalReporters} color="#8b5cf6" />
        </View>

        {/* Weekly Trend */}
        {data.weeklyTrend.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t.weeklyTrend}</Text>
            <View style={styles.trendWrap}>
              {data.weeklyTrend.map((day, i) => (
                <View key={i} style={styles.trendRow}>
                  <Text style={styles.trendDay}>{day.dayName}</Text>
                  <View style={styles.trendBars}>
                    <View style={styles.trendBarItem}>
                      <View
                        style={[
                          styles.trendBar,
                          {
                            width: Math.max(4, Math.min(120, day.crimes * 8)),
                            backgroundColor: "#ef4444",
                          },
                        ]}
                      />
                      <Text style={styles.trendBarCount}>{day.crimes}</Text>
                    </View>
                    <View style={styles.trendBarItem}>
                      <View
                        style={[
                          styles.trendBar,
                          {
                            width: Math.max(4, Math.min(120, day.missing * 8)),
                            backgroundColor: "#3b82f6",
                          },
                        ]}
                      />
                      <Text style={styles.trendBarCount}>{day.missing}</Text>
                    </View>
                  </View>
                </View>
              ))}
              <View style={styles.trendLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#ef4444" }]} />
                  <Text style={styles.legendText}>{t.legendCrimes}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#3b82f6" }]} />
                  <Text style={styles.legendText}>{t.legendMissing}</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Severity Groups */}
        {data.severityGroups.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t.bySeverity}</Text>
            <View style={styles.listCard}>
              {data.severityGroups.map((item, i) => (
                <View key={i} style={styles.listRow}>
                  <Text style={styles.listName}>{item.name}</Text>
                  <Text style={styles.listValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Crime By Type */}
        {data.crimeByType.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t.byType}</Text>
            <View style={styles.listCard}>
              {data.crimeByType.map((item, i) => (
                <View key={i} style={styles.listRow}>
                  <Text style={styles.listName}>{item.name}</Text>
                  <Text style={styles.listValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTextWrap: { flex: 1 },
  title: { fontSize: 20, fontWeight: "700", color: "#0f172a" },
  subtitle: { fontSize: 12, color: "#4b5563", marginTop: 2 },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statCard: {
    flex: 1,
    minWidth: "20%",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 12,
    alignItems: "center",
  },
  statValue: { fontSize: 20, fontWeight: "700", color: "#0f172a" },
  statLabel: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  trendWrap: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    gap: 8,
  },
  trendRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  trendDay: { width: 36, fontSize: 12, color: "#374151", fontWeight: "600" },
  trendBars: { flex: 1, gap: 3 },
  trendBarItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  trendBar: { height: 8, borderRadius: 4 },
  trendBarCount: { fontSize: 11, color: "#6b7280", width: 20 },
  trendLegend: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: "#6b7280" },
  listCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  listRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  listName: { fontSize: 13, color: "#374151" },
  listValue: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  errorText: { color: "#ef4444", marginBottom: 12 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: "#74becb", borderRadius: 8 },
  retryText: { color: "#fff", fontWeight: "600" },
});
