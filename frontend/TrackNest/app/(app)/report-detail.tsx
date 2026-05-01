import { reportDetail as reportDetailLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { criminalReportsService } from "@/services/criminalReports";
import type { CrimeReport } from "@/types/criminalReports";
import { colors, radii, spacing } from "@/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function severityColors(n: number): { bg: string; text: string } {
  if (n >= 4) return { bg: "#ffd6d6", text: "#c0392b" };
  if (n >= 2) return { bg: "#fff0d6", text: "#e67e22" };
  return { bg: "#d6f0e0", text: "#1e8449" };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.infoTextBox}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ReportDetailScreen() {
  const router = useRouter();
  const t = useTranslation(reportDetailLang);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [report, setReport] = useState<CrimeReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    criminalReportsService
      .getPublicCrimeReportById(id)
      .then((data) => setReport(data))
      .catch((err) => console.error("Failed to load report:", err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = async () => {
    if (!report) return;
    try {
      await Share.share({
        message: `[TrackNest] ${report.title}\nLocation: ${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}\n${report.content}`,
      });
    } catch (_) {}
  };

  const handleGetDirections = () => {
    if (!report) return;
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${report.latitude},${report.longitude}`
    );
  };

  const handleFollowIncident = () => {
    showToast("You will be notified of any updates to this incident.", t.followIncident);
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Not Found ─────────────────────────────────────────────────────────────

  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>{t.pageTitle}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>{t.reportNotFound}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Derived Values ────────────────────────────────────────────────────────

  const sev = severityColors(report.severity);
  const sevLabel =
    report.severity >= 4
      ? t.highSeverity
      : report.severity >= 2
      ? t.mediumSeverity
      : t.lowSeverity;

  const statusLabel = report.arrested ? "Resolved" : t.underInvestigation;
  const statusColor = report.arrested ? colors.success : colors.primary;

  const incidentDateStr = report.date
    ? new Date(report.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  const timeOfEventStr =
    new Date(report.createdAt).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }) + " (Estimated)";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t.pageTitle}</Text>
        <Pressable onPress={handleShare} style={styles.headerBtn}>
          <Ionicons name="share-social-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Hero Map ── */}
        <View style={styles.heroMapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.heroMap}
            initialRegion={{
              latitude: report.latitude,
              longitude: report.longitude,
              latitudeDelta: 0.012,
              longitudeDelta: 0.012,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker
              coordinate={{ latitude: report.latitude, longitude: report.longitude }}
              pinColor={colors.danger}
              title={report.title}
            />
          </MapView>
          <View style={styles.getDirectionsBtnWrapper}>
            <Pressable style={styles.getDirectionsBtn} onPress={handleGetDirections}>
              <Ionicons name="navigate-outline" size={15} color={colors.primary} />
              <Text style={styles.getDirectionsBtnText}>{t.getDirections}</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Title Block ── */}
        <View style={styles.titleBlock}>
          <View style={[styles.sevBadge, { backgroundColor: sev.bg }]}>
            <Text style={[styles.sevText, { color: sev.text }]}>{sevLabel}</Text>
          </View>
          <Text style={styles.reportTitle}>{report.title}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Info Rows ── */}
        <View style={styles.infoCard}>
          <InfoRow
            icon="location-outline"
            label="LOCATION"
            value={`${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}`}
          />
          <InfoRow
            icon="calendar-outline"
            label={t.reportedOn.toUpperCase()}
            value={incidentDateStr}
          />
          <InfoRow
            icon="time-outline"
            label={t.timeOfEvent.toUpperCase()}
            value={timeOfEventStr}
            last
          />
        </View>

        <View style={styles.divider} />

        {/* ── Incident Overview ── */}
        <View style={styles.overviewSection}>
          <Text style={styles.overviewTitle}>{t.incidentOverview}</Text>
          <Text style={styles.overviewText}>{report.content}</Text>
        </View>

        {/* ── Photos ── */}
        {report.photos && report.photos.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.overviewSection}>
              <Text style={styles.overviewTitle}>
                {t.photosCount.replace("{{count}}", String(report.photos.length))}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoRow}
              >
                {report.photos.map((url, i) => (
                  <Image
                    key={i}
                    source={{ uri: url }}
                    style={styles.photo}
                    contentFit="cover"
                  />
                ))}
              </ScrollView>
            </View>
          </>
        )}

        {/* ── Action Buttons ── */}
        <View style={styles.actionRow}>
          <Pressable style={[styles.actionBtn, styles.shareBtn]} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.shareBtnText}>{t.share}</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.followBtn]} onPress={handleFollowIncident}>
            <Ionicons name="notifications" size={20} color="#fff" />
            <Text style={styles.followBtnText}>{t.followIncident}</Text>
          </Pressable>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 16, color: colors.textSecondary },

  // Header
  header: {
    height: 56,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary },
  headerBtn: { padding: 6, borderRadius: radii.sm },

  scroll: { flex: 1 },

  // Hero Map
  heroMapContainer: {
    height: 230,
    width: "100%",
    backgroundColor: colors.bgSecondary,
  },
  heroMap: { flex: 1 },
  getDirectionsBtnWrapper: {
    position: "absolute",
    bottom: spacing.md,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  getDirectionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  getDirectionsBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },

  // Title Block
  titleBlock: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.bg,
  },
  sevBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 4,
  },
  sevText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.6 },
  reportTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.textPrimary,
    lineHeight: 32,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 2 },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  statusLabel: { fontSize: 14, fontWeight: "600" },

  divider: { height: 1, backgroundColor: colors.border },

  // Info Card
  infoCard: {
    backgroundColor: colors.bg,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTextBox: { flex: 1 },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  infoValue: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },

  // Incident Overview
  overviewSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.bg,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  overviewText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },

  // Photos
  photoRow: { flexDirection: "row", gap: spacing.sm },
  photo: {
    width: 160,
    height: 120,
    borderRadius: radii.md,
    backgroundColor: colors.border,
  },

  // Action Buttons
  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: radii.lg,
    gap: 8,
  },
  shareBtn: {
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  shareBtnText: { fontWeight: "700", fontSize: 14, color: colors.textPrimary },
  followBtn: { backgroundColor: colors.primary },
  followBtnText: { fontWeight: "700", fontSize: 14, color: "#fff" },
});
