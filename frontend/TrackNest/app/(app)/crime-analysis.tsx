import {
  criminalReportsService,
  CrimeAnalysisReportResponse,
  getSeverityColor,
  getSeverityLabel,
} from "@/services/criminalReports";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDisplay(d: Date): string {
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function CrimeAnalysisScreen() {
  const router = useRouter();

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState<Date>(thirtyDaysAgo);
  const [endDate, setEndDate] = useState<Date>(today);
  const [showPicker, setShowPicker] = useState<"start" | "end" | null>(null);

  const [data, setData] = useState<CrimeAnalysisReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePickerChange = (
    event: DateTimePickerEvent,
    selected?: Date,
  ) => {
    if (Platform.OS === "android") setShowPicker(null);
    if (!selected) return;
    if (showPicker === "start") setStartDate(selected);
    else setEndDate(selected);
  };

  const handleGenerate = async () => {
    if (startDate > endDate) {
      setError("Start date must be before end date.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await criminalReportsService.getCrimeAnalysis(
        toISODate(startDate),
        toISODate(endDate),
      );
      setData(res);
    } catch (e) {
      setError("Failed to load crime analysis.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Crime Analysis</Text>
          <Text style={styles.subtitle}>Trends, hotspots & statistics</Text>
        </View>
      </View>

      {/* Date Range Picker */}
      <View style={styles.filterCard}>
        <View style={styles.dateRow}>
          <View style={styles.datePart}>
            <Text style={styles.dateLabel}>From</Text>
            <Pressable
              style={styles.datePill}
              onPress={() => setShowPicker("start")}
            >
              <Ionicons name="calendar-outline" size={14} color="#74becb" />
              <Text style={styles.dateText}>{formatDisplay(startDate)}</Text>
            </Pressable>
          </View>
          <Ionicons name="arrow-forward" size={16} color="#94a3b8" />
          <View style={styles.datePart}>
            <Text style={styles.dateLabel}>To</Text>
            <Pressable
              style={styles.datePill}
              onPress={() => setShowPicker("end")}
            >
              <Ionicons name="calendar-outline" size={14} color="#74becb" />
              <Text style={styles.dateText}>{formatDisplay(endDate)}</Text>
            </Pressable>
          </View>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          style={[styles.generateBtn, loading && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="bar-chart-outline" size={16} color="#fff" />
              <Text style={styles.generateText}>Generate Report</Text>
            </>
          )}
        </Pressable>
      </View>

      {showPicker && (
        <DateTimePicker
          value={showPicker === "start" ? startDate : endDate}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          maximumDate={today}
          onChange={handlePickerChange}
        />
      )}

      {data && (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Stats */}
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{data.totalCrimeReports}</Text>
              <Text style={styles.statLabel}>Crime Reports</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{data.totalMissingPersonReports}</Text>
              <Text style={styles.statLabel}>Missing Persons</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: "#22c55e" }]}>{data.totalArrests}</Text>
              <Text style={styles.statLabel}>Arrests</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: "#ef4444" }]}>{data.totalVictims}</Text>
              <Text style={styles.statLabel}>Victims</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: "#f59e0b" }]}>{data.totalOffenders}</Text>
              <Text style={styles.statLabel}>Offenders</Text>
            </View>
          </View>

          {/* Crime Trend */}
          {data.crimeTrend.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Crime Trend</Text>
              <View style={styles.trendWrap}>
                {data.crimeTrend.map((point, i) => (
                  <View key={i} style={styles.trendRow}>
                    <Text style={styles.trendDate}>{point.date.slice(5)}</Text>
                    <View style={styles.trendBarWrap}>
                      <View
                        style={[
                          styles.trendBar,
                          {
                            width: Math.max(4, Math.min(180, point.count * 12)),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.trendCount}>{point.count}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Crimes by Severity */}
          {Object.keys(data.crimesBySeverity).length > 0 && (
            <>
              <Text style={styles.sectionTitle}>By Severity</Text>
              <View style={styles.listCard}>
                {Object.entries(data.crimesBySeverity)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([sev, count]) => {
                    const n = Number(sev);
                    return (
                      <View key={sev} style={styles.listRow}>
                        <View style={styles.listLeft}>
                          <View
                            style={[
                              styles.sevDot,
                              { backgroundColor: getSeverityColor(n) },
                            ]}
                          />
                          <Text style={styles.listName}>
                            {getSeverityLabel(n)} (Level {sev})
                          </Text>
                        </View>
                        <Text style={styles.listValue}>{count}</Text>
                      </View>
                    );
                  })}
              </View>
            </>
          )}

          {/* Crimes by Type */}
          {Object.keys(data.crimesByType).length > 0 && (
            <>
              <Text style={styles.sectionTitle}>By Type</Text>
              <View style={styles.listCard}>
                {Object.entries(data.crimesByType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <View key={type} style={styles.listRow}>
                      <Text style={styles.listName}>{type}</Text>
                      <Text style={styles.listValue}>{count}</Text>
                    </View>
                  ))}
              </View>
            </>
          )}

          {/* Hotspots */}
          {data.hotspots.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>
                Hotspots ({data.hotspots.length})
              </Text>
              <FlatList
                data={data.hotspots}
                keyExtractor={(_, i) => String(i)}
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                  <View style={styles.hotspotCard}>
                    <View style={styles.hotspotLeft}>
                      <View
                        style={[
                          styles.hotspotIndex,
                          { backgroundColor: getSeverityColor(Math.round(item.averageSeverity)) },
                        ]}
                      >
                        <Text style={styles.hotspotIndexText}>{index + 1}</Text>
                      </View>
                      <View>
                        <Text style={styles.hotspotCoord}>
                          {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                        </Text>
                        <Text style={styles.hotspotMeta}>
                          {item.incidentCount} incidents • Avg severity{" "}
                          {item.averageSeverity.toFixed(1)}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.hotspotSeverity,
                        { color: getSeverityColor(Math.round(item.averageSeverity)) },
                      ]}
                    >
                      {getSeverityLabel(Math.round(item.averageSeverity)).toUpperCase()}
                    </Text>
                  </View>
                )}
              />
            </>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {!data && !loading && (
        <View style={styles.emptyWrap}>
          <Ionicons name="bar-chart-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>
            Select a date range and tap{"\n"}Generate Report to see analysis.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
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
  filterCard: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    gap: 12,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  datePart: { flex: 1, gap: 4 },
  dateLabel: { fontSize: 11, color: "#6b7280", fontWeight: "600", textTransform: "uppercase" },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dateText: { fontSize: 13, color: "#1e293b", fontWeight: "500" },
  errorText: { fontSize: 12, color: "#ef4444" },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#74becb",
    borderRadius: 10,
    paddingVertical: 10,
  },
  generateBtnDisabled: { opacity: 0.65 },
  generateText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  scroll: { paddingHorizontal: 16, paddingTop: 12 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 12,
    alignItems: "center",
  },
  statValue: { fontSize: 22, fontWeight: "700", color: "#0f172a" },
  statLabel: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  trendWrap: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    gap: 6,
  },
  trendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  trendDate: { width: 36, fontSize: 11, color: "#475569", fontWeight: "500" },
  trendBarWrap: { flex: 1 },
  trendBar: { height: 10, borderRadius: 5, backgroundColor: "#74becb" },
  trendCount: { width: 24, fontSize: 11, color: "#64748b", textAlign: "right" },
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
  listLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  sevDot: { width: 10, height: 10, borderRadius: 5 },
  listName: { fontSize: 13, color: "#374151" },
  listValue: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  hotspotCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    marginBottom: 8,
  },
  hotspotLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  hotspotIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  hotspotIndexText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  hotspotCoord: { fontSize: 13, fontWeight: "600", color: "#0f172a" },
  hotspotMeta: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  hotspotSeverity: { fontSize: 11, fontWeight: "700" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 14, color: "#94a3b8", textAlign: "center", lineHeight: 22 },
});
