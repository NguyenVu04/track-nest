import Card from "@/components/Card";
import { reports as reportsLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import {
  fetchGuides,
  fetchMissingPersons,
  fetchReports,
  Guide,
  MissingPerson,
  Report,
} from "@/services/reports";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, spacing } from "@/styles/styles";

// initial empty placeholder; data will be loaded from services
const INITIAL_REPORTS: Report[] = [];
const INITIAL_MISSING: MissingPerson[] = [];
const INITIAL_GUIDES: Guide[] = [];

function ReportCard({ item }: { item: Report }) {
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push(`/report-detail?id=${item.id}`)}>
      <Card style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="warning-outline" size={20} color="#ff4d4f" />
            <Text style={styles.cardTitle}>{item.title}</Text>
          </View>
          <View
            style={[
              styles.severityChip,
              item.severity === "High"
                ? styles.sevHigh
                : item.severity === "Medium"
                  ? styles.sevMed
                  : styles.sevLow,
            ]}
          >
            <Text style={styles.severityText}>{item.severity}</Text>
          </View>
        </View>
        <Text style={styles.cardMeta}>📍 {item.address}</Text>
        <Text style={styles.cardMeta}>🗓 {item.date}</Text>
        <Text style={styles.cardDesc}>{item.description}</Text>
      </Card>
    </Pressable>
  );
}

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
    <Pressable onPress={() => router.push(`/missing-detail?id=${item.id}`)}>
      <Card style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="search-outline" size={20} color="#ff4d4f" />
            <Text style={styles.cardTitle}>{item.name}</Text>
          </View>
          <View
            style={[
              styles.severityChip,
              item.severity === "High"
                ? styles.sevHigh
                : item.severity === "Medium"
                  ? styles.sevMed
                  : styles.sevLow,
            ]}
          >
            <Text style={styles.severityText}>{item.severity}</Text>
          </View>
        </View>
        <Text style={styles.cardMeta}>
          👤 {ageLabel}: {item.age} {yearsOldLabel}
        </Text>
        <Text style={styles.cardMeta}>
          📍 {lastSeenLabel}: {item.lastSeen}
        </Text>
        <Text style={styles.cardDesc}>{item.description}</Text>
      </Card>
    </Pressable>
  );
}

function GuideCard({
  item,
  categoryLabel,
}: {
  item: Guide;
  categoryLabel: string;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#74becb"
          />
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
      </View>
      <Text style={styles.cardMeta}>
        📚 {categoryLabel}: {item.category}
      </Text>
      <Text style={styles.cardDesc}>{item.content}</Text>
    </Card>
  );
}

export default function ReportsScreen() {
  const router = useRouter();
  const t = useTranslation(reportsLang);
  const [tab, setTab] = useState("Crime Reports");
  const tabs = [
    { key: "Crime Reports", label: t.tabCrimeReports },
    { key: "Missing", label: t.tabMissing },
    { key: "Guide", label: t.tabGuide },
  ];

  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);
  const [missing, setMissing] = useState<MissingPerson[]>(INITIAL_MISSING);
  const [guides, setGuides] = useState<Guide[]>(INITIAL_GUIDES);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = async (pageToLoad = 1) => {
    try {
      if (pageToLoad === 1) setLoading(true);
      const res = await fetchReports({ page: pageToLoad, perPage: 10 });
      if (pageToLoad === 1) setReports(res.data);
      else setReports((prev) => [...prev, ...res.data]);
      setPage(res.page);
    } catch (err) {
      console.error("fetchReports error", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMissing = async (pageToLoad = 1) => {
    try {
      if (pageToLoad === 1) setLoading(true);
      const res = await fetchMissingPersons({ page: pageToLoad, perPage: 10 });
      if (pageToLoad === 1) setMissing(res.data);
      else setMissing((prev) => [...prev, ...res.data]);
      setPage(res.page);
    } catch (err) {
      console.error("fetchMissing error", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadGuides = async (pageToLoad = 1) => {
    try {
      if (pageToLoad === 1) setLoading(true);
      const res = await fetchGuides({ page: pageToLoad, perPage: 10 });
      if (pageToLoad === 1) setGuides(res.data);
      else setGuides((prev) => [...prev, ...res.data]);
      setPage(res.page);
    } catch (err) {
      console.error("fetchGuides error", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Load data based on selected tab
    if (tab === "Crime Reports") {
      loadReports(1);
    } else if (tab === "Missing") {
      loadMissing(1);
    } else if (tab === "Guide") {
      loadGuides(1);
    }
  }, [tab]);

  const onRefresh = () => {
    setRefreshing(true);
    if (tab === "Crime Reports") {
      loadReports(1);
    } else if (tab === "Missing") {
      loadMissing(1);
    } else if (tab === "Guide") {
      loadGuides(1);
    }
  };

  const onEndReached = () => {
    if (tab === "Crime Reports") {
      loadReports(page + 1);
    } else if (tab === "Missing") {
      loadMissing(page + 1);
    } else if (tab === "Guide") {
      loadGuides(page + 1);
    }
  };

  type DataItem = Report | MissingPerson | Guide;

  const getCurrentData = (): DataItem[] => {
    if (tab === "Crime Reports") return reports;
    if (tab === "Missing") return missing;
    if (tab === "Guide") return guides;
    return [];
  };

  const renderItem = ({ item }: { item: DataItem }) => {
    if (tab === "Crime Reports") return <ReportCard item={item as Report} />;
    if (tab === "Missing")
      return (
        <MissingPersonCard
          item={item as MissingPerson}
          ageLabel={t.age}
          yearsOldLabel={t.yearsOld}
          lastSeenLabel={t.lastSeen}
        />
      );
    if (tab === "Guide") {
      return <GuideCard item={item as Guide} categoryLabel={t.category} />;
    }
    return null;
  };

  const onCreateReport = () => {
    if (tab === "Crime Reports") {
      router.push("/(app)/create-report" as any);
    } else if (tab === "Missing") {
      router.push("/(app)/create-missing" as any);
    }
    // Guide tab: FAB hidden, no action
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f7fa" }}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>{t.title}</Text>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.headerIconBtn}
              onPress={() => router.push("/(app)/crime-dashboard" as any)}
              hitSlop={8}
            >
              <Ionicons name="stats-chart-outline" size={20} color="#74becb" />
            </Pressable>
            <Pressable
              style={styles.headerIconBtn}
              onPress={() => router.push("/(app)/crime-analysis" as any)}
              hitSlop={8}
            >
              <Ionicons name="bar-chart-outline" size={20} color="#74becb" />
            </Pressable>
          </View>
        </View>

        <View style={styles.segmentRow}>
          {tabs.map((tabItem) => (
            <Pressable
              key={tabItem.key}
              onPress={() => setTab(tabItem.key)}
              style={[
                styles.segmentBtn,
                tab === tabItem.key ? styles.segmentActive : null,
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  tab === tabItem.key ? styles.segmentTextActive : null,
                ]}
              >
                {tabItem.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <ActivityIndicator size="large" color="#74becb" />
          </View>
        ) : (
          <FlatList<DataItem>
            data={getCurrentData()}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.6}
          />
        )}

        {tab !== "Guide" && (
          <Pressable style={styles.fab} onPress={onCreateReport}>
            <Ionicons name="add" size={28} color="#fff" />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  headerRow: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  headerActions: { flexDirection: "row", gap: 4 },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f9ff",
    alignItems: "center",
    justifyContent: "center",
  },
  segmentRow: { flexDirection: "row", padding: 12, gap: 8 },
  segmentBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#f2f2f2",
  },
  segmentActive: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },
  segmentText: { color: "#666" },
  segmentTextActive: { color: "#74becb", fontWeight: "600" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitle: { fontWeight: "700" },
  severityChip: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 14 },
  severityText: { fontSize: 12 },
  sevHigh: { backgroundColor: "#ffd6d6" },
  sevMed: { backgroundColor: "#fff0d6" },
  sevLow: { backgroundColor: "#f2fff0" },
  cardMeta: { color: "#666", fontSize: 12, marginBottom: 2 },
  cardDesc: { marginTop: 6, color: "#444" },
  fab: {
    position: "absolute",
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
