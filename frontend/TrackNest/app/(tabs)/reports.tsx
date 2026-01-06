import Card from "@/components/Card";
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

function MissingPersonCard({ item }: { item: MissingPerson }) {
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
        <Text style={styles.cardMeta}>👤 Age: {item.age} years old</Text>
        <Text style={styles.cardMeta}>📍 Last Seen: {item.lastSeen}</Text>
        <Text style={styles.cardDesc}>{item.description}</Text>
      </Card>
    </Pressable>
  );
}

function GuideCard({ item }: { item: Guide }) {
  return (
    <Card style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#0b62ff"
          />
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
      </View>
      <Text style={styles.cardMeta}>📚 {item.category}</Text>
      <Text style={styles.cardDesc}>{item.content}</Text>
    </Card>
  );
}

export default function ReportsScreen() {
  const [tab, setTab] = useState("Crime Reports");
  const tabs = ["Crime Reports", "Missing", "Guide"];

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
      return <MissingPersonCard item={item as MissingPerson} />;
    if (tab === "Guide") return <GuideCard item={item as Guide} />;
    return null;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        <View style={styles.segmentRow}>
          {tabs.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[
                styles.segmentBtn,
                tab === t ? styles.segmentActive : null,
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  tab === t ? styles.segmentTextActive : null,
                ]}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <ActivityIndicator size="large" color="#0b62ff" />
          </View>
        ) : (
          <FlatList<DataItem>
            data={getCurrentData()}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 12 }}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.6}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerRow: {
    height: 72,
    paddingTop: 24,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
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
  segmentTextActive: { color: "#0b62ff", fontWeight: "600" },
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
});
