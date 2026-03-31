import { reportDetail as reportDetailLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { getReportById, Report } from "@/services/reports";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReportDetailScreen() {
  const router = useRouter();
  const t = useTranslation(reportDetailLang);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      if (!id) return;
      try {
        const data = await getReportById(id);
        setReport(data || null);
      } catch (err) {
        console.error("Failed to load report:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color="#74becb" />
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.push("/reports")}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </Pressable>
          <Text style={styles.headerTitle}>{t.pageTitle}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontSize: 16, color: "#666" }}>
            {t.reportNotFound}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>{t.pageTitle}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.detailCard}>
          <View style={styles.titleRow}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <Ionicons name="warning-outline" size={28} color="#ff4d4f" />
              <Text style={styles.title}>{report.title}</Text>
            </View>
            <View
              style={[
                styles.severityChip,
                report.severity === "High"
                  ? styles.sevHigh
                  : report.severity === "Medium"
                    ? styles.sevMed
                    : styles.sevLow,
              ]}
            >
              <Text style={styles.severityText}>{report.severity}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.location}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#74becb" />
              <Text style={styles.infoText}>{report.address}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.dateTime}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color="#74becb" />
              <Text style={styles.infoText}>{report.date}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.description}</Text>
            <Text style={styles.description}>{report.description}</Text>
          </View>

          <View style={styles.actionButtons}>
            <Pressable style={[styles.button, styles.callButton]}>
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.buttonText}>{t.callPolice}</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.shareButton]}>
              <Ionicons name="share-social" size={20} color="#74becb" />
              <Text style={[styles.buttonText, { color: "#74becb" }]}>
                {t.share}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    flex: 1,
  },
  severityChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  severityText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sevHigh: {
    backgroundColor: "#ffd6d6",
  },
  sevMed: {
    backgroundColor: "#fff0d6",
  },
  sevLow: {
    backgroundColor: "#f2fff0",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: "#555",
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  callButton: {
    backgroundColor: "#ff4d4f",
  },
  shareButton: {
    backgroundColor: "#f0f0f0",
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 14,
    color: "#fff",
  },
});
