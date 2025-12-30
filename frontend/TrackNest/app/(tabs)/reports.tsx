import Card from "@/components/Card";
import { fetchReports, Report } from "@/services/reports";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// initial empty placeholder; data will be loaded from services
const INITIAL_REPORTS: Report[] = [];

function ReportCard({ item }: { item: Report }) {
  return (
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
  );
}

export default function ReportsScreen() {
  const [tab, setTab] = useState("Crime Reports");
  const tabs = ["Crime Reports", "Missing", "Guide"];

  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);
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

  useEffect(() => {
    loadReports(1);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadReports(1);
  };

  const onEndReached = () => {
    loadReports(page + 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => {}}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>Reports & Guides</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.segmentRow}>
        {tabs.map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.segmentBtn, tab === t ? styles.segmentActive : null]}
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
        <FlatList
          data={reports}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <ReportCard item={item} />}
          contentContainerStyle={{ padding: 12 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
        />
      )}
    </View>
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
