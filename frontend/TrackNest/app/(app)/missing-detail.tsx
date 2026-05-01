import { missingDetail as missingDetailLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { criminalReportsService } from "@/services/criminalReports";
import type { MissingPersonReport } from "@/types/criminalReports";
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
import { ChatbotPanel } from "@/components/shared/ChatbotPanel";

// ─── Sub-components ───────────────────────────────────────────────────────────

function PhysicalRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.physicalRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.physicalLabel}>{label}</Text>
      <Text style={styles.physicalValue}>{value}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MissingDetailScreen() {
  const router = useRouter();
  const t = useTranslation(missingDetailLang);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [person, setPerson] = useState<MissingPersonReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPerson = async () => {
      if (!id) return;
      try {
        const data = await criminalReportsService.getMissingPersonReportById(id);
        setPerson(data);
      } catch (err) {
        console.error("Failed to load missing person:", err);
      } finally {
        setLoading(false);
      }
    };
    loadPerson();
  }, [id]);

  const handleShareForHelp = async () => {
    if (!person) return;
    try {
      await Share.share({
        message: `[Missing Person Alert] ${person.fullName}\nLast seen: ${
          person.date
            ? new Date(person.date).toLocaleDateString("en-US")
            : "Unknown"
        }\n\n${person.content}`,
      });
    } catch (_) {}
  };

  const handleContactAuthorities = () => {
    Linking.openURL("tel:113");
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

  if (!person) {
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
          <Ionicons name="person-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>{t.personNotFound}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Derived Values ────────────────────────────────────────────────────────

  const missingDays = person.date
    ? Math.floor(
        (Date.now() - new Date(person.date).getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const lastSeenDateStr = person.date
    ? new Date(person.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown";

  const lastSeenTimeStr = person.date
    ? new Date(person.date).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "Unknown";

  const isPublished = person.status === "PUBLISHED";
  const badgeLabel = isPublished ? t.activeSearch : person.status ?? "Pending";
  const badgeColor = isPublished
    ? colors.success
    : person.status === "REJECTED"
    ? colors.danger
    : colors.warn;
  const badgeBg = isPublished
    ? colors.successLight
    : person.status === "REJECTED"
    ? colors.dangerLight
    : colors.warnLight;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t.pageTitle}</Text>
        <Pressable onPress={handleShareForHelp} style={styles.headerBtn}>
          <Ionicons name="share-social-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Hero Photo ── */}
        <View style={styles.heroContainer}>
          {person.photo ? (
            <Image
              source={{ uri: person.photo }}
              style={styles.heroPhoto}
              contentFit="cover"
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="person" size={90} color={colors.textMuted} />
            </View>
          )}
          {/* Status badge overlaid on photo (bottom-left) */}
          <View style={styles.heroBadgeContainer}>
            <View style={[styles.heroBadge, { backgroundColor: badgeBg }]}>
              <View style={[styles.heroBadgeDot, { backgroundColor: badgeColor }]} />
              <Text style={[styles.heroBadgeText, { color: badgeColor }]}>
                {badgeLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Identity Block ── */}
        <View style={styles.identityBlock}>
          <Text style={styles.nameText}>{person.fullName}</Text>
          {missingDays !== null && (
            <Text style={styles.subtitleText}>
              {`Missing ${missingDays} day${missingDays !== 1 ? "s" : ""}`}
            </Text>
          )}
        </View>

        {/* ── Physical Description ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t.physicalDescription}</Text>
          </View>
          {/* Individual attribute rows */}
          <PhysicalRow label={t.height} value="—" />
          <PhysicalRow label={t.weight} value="—" />
          <PhysicalRow label="Hair Color" value="—" />
          <PhysicalRow label="Eye Color" value="—" last />
          {/* Free-text distinguishing features from content */}
          {!!person.content && (
            <View style={styles.distinguishingBlock}>
              <Text style={styles.distinguishingLabel}>Distinguishing Features</Text>
              <Text style={styles.distinguishingText}>{person.content}</Text>
            </View>
          )}
        </View>

        {/* ── Last Seen ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t.lastSeen}</Text>
          </View>

          {/* Map thumbnail */}
          {person.latitude != null && person.longitude != null ? (
            <View style={styles.mapContainer}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                  latitude: person.latitude,
                  longitude: person.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: person.latitude,
                    longitude: person.longitude,
                  }}
                  pinColor={colors.danger}
                />
              </MapView>
            </View>
          ) : null}

          {/* Location / Date / Time / Clothing grid */}
          <View style={styles.lastSeenGrid}>
            <View style={styles.lastSeenRow}>
              <Text style={styles.lastSeenKey}>LOCATION</Text>
              <Text style={styles.lastSeenVal} numberOfLines={2}>
                {person.latitude != null && person.longitude != null
                  ? `${person.latitude.toFixed(5)}, ${person.longitude.toFixed(5)}`
                  : "Unknown"}
              </Text>
            </View>
            <View style={styles.lastSeenRowHalf}>
              <View style={[styles.lastSeenHalfCell, { borderRightWidth: 1, borderRightColor: colors.border }]}>
                <Text style={styles.lastSeenKey}>DATE</Text>
                <Text style={styles.lastSeenVal}>{lastSeenDateStr}</Text>
              </View>
              <View style={styles.lastSeenHalfCell}>
                <Text style={styles.lastSeenKey}>TIME</Text>
                <Text style={styles.lastSeenVal}>{lastSeenTimeStr}</Text>
              </View>
            </View>
            {!!person.contactPhone && (
              <View style={[styles.lastSeenRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.lastSeenKey}>CONTACT</Text>
                <Text style={styles.lastSeenVal}>{person.contactPhone}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Action Buttons ── */}
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionBtn, styles.shareForHelpBtn]}
            onPress={handleShareForHelp}
          >
            <Ionicons name="share-social-outline" size={20} color={colors.primary} />
            <Text style={styles.shareForHelpText}>{t.shareForHelp}</Text>
          </Pressable>
        </View>

        <View style={styles.contactRow}>
          <Pressable
            style={[styles.actionBtn, styles.contactBtn]}
            onPress={handleContactAuthorities}
          >
            <Ionicons name="alert-circle" size={20} color="#fff" />
            <Text style={styles.contactBtnText}>{t.contactAuthorities}</Text>
          </Pressable>
        </View>

        {/* ── Community Note ── */}
        <View style={styles.communityNote}>
          <View style={styles.communityNoteHeader}>
            <Ionicons name="information-circle" size={18} color={colors.primary} />
            <Text style={styles.communityNoteTitle}>{t.communityNote}</Text>
          </View>
          <Text style={styles.communityNoteText}>
            {`If you have any information regarding ${person.fullName}'s whereabouts, please use the button above to contact local law enforcement.`}
            {person.personalId ? ` Reference Case #${person.personalId}.` : ""}
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Floating Chatbot Panel */}
      <ChatbotPanel 
        documentId={person.content} 
        title={person.fullName} 
        emptyState="Ask a question about this missing person report." 
      />
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

  // Hero Photo
  heroContainer: {
    width: "100%",
    height: 280,
    backgroundColor: colors.bgSecondary,
    position: "relative",
  },
  heroPhoto: { width: "100%", height: "100%" },
  heroPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgSecondary,
  },
  heroBadgeContainer: {
    position: "absolute",
    bottom: spacing.md,
    left: spacing.lg,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroBadgeDot: { width: 7, height: 7, borderRadius: 4 },
  heroBadgeText: { fontSize: 13, fontWeight: "700" },

  // Identity Block
  identityBlock: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 4,
  },
  nameText: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    lineHeight: 34,
  },
  subtitleText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },

  // Section Card
  sectionCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  // Physical Rows
  physicalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  physicalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  physicalValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  distinguishingBlock: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 6,
  },
  distinguishingLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  distinguishingText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  // Map
  mapContainer: {
    height: 170,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  map: { flex: 1 },

  // Last Seen Grid
  lastSeenGrid: {},
  lastSeenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  lastSeenRowHalf: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastSeenHalfCell: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    gap: 4,
  },
  lastSeenKey: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  lastSeenVal: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    flexShrink: 1,
  },

  // Action Buttons
  actionRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  contactRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: radii.lg,
    gap: 8,
  },
  shareForHelpBtn: {
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  shareForHelpText: { fontWeight: "700", fontSize: 15, color: colors.primary },
  contactBtn: { backgroundColor: colors.danger },
  contactBtnText: { fontWeight: "700", fontSize: 15, color: "#fff" },

  // Community Note
  communityNote: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  communityNoteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  communityNoteTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  communityNoteText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
