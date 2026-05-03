import {
  LocationHistoryPoint,
  LocationHistoryViewer,
} from "@/components/LocationHistoryViewer";
import { FollowerBottomSheet as followerBottomSheetLang } from "@/constant/languages";
import { Follower } from "@/constant/types";
import { useTranslation } from "@/hooks/useTranslation";
import { FamilyMemberLocation } from "@/proto/tracker_pb";
import { listFamilyMemberLocationHistory } from "@/services/tracker";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { FollowerInfo } from "./FollowerInfo";
import { colors, radii, spacing } from "@/styles/styles";

type StatTileProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  unit?: string;
};

function StatTile({ icon, label, value, unit }: StatTileProps) {
  return (
    <View style={styles.statTile}>
      <View style={styles.statIconRow}>
        <Ionicons name={icon} size={13} color={colors.textMuted} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatDate(d: Date) {
  return d.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const FollowerBottomSheet = ({
  follower,
  speedKmh,
  address,
  onChatPress,
  onCallPress,
  onSosPress,
}: {
  follower: Follower | null;
  speedKmh?: number | null;
  address?: string | null;
  onChatPress?: () => void;
  onCallPress?: () => void;
  onSosPress?: () => void;
}) => {
  const t = useTranslation(followerBottomSheetLang);
  const router = useRouter();
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const filterSheetRef = useRef<BottomSheetModal>(null);
  const hasFetchedHistoryRef = useRef(false);
  const [locationHistory, setLocationHistory] = useState<
    FamilyMemberLocation.AsObject[] | null
  >(null);

  // Filter state
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [fromTime, setFromTime] = useState<Date>(startOfDay(new Date()));
  const [toTime, setToTime] = useState<Date>(endOfDay(new Date()));
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const { height: screenHeight } = useWindowDimensions();

  const closeFilterSheet = useCallback(() => {
    filterSheetRef.current?.dismiss();
    setShowDayPicker(false);
    setShowFromPicker(false);
    setShowToPicker(false);
  }, []);

  const openFilterSheet = useCallback(() => {
    filterSheetRef.current?.present();
  }, []);

  const sorted = [...(locationHistory ?? [])].sort(
    (a, b) => a.timestampMs - b.timestampMs,
  );

  const availableDays = useMemo(() => {
    const daySet = new Set<string>();
    sorted.forEach((e) => {
      daySet.add(startOfDay(new Date(e.timestampMs)).toDateString());
    });
    return Array.from(daySet)
      .map((s) => new Date(s))
      .sort((a, b) => b.getTime() - a.getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationHistory]);

  // When new history arrives, jump to the most recent day
  useEffect(() => {
    if (sorted.length === 0) return;
    setSelectedDay(new Date(sorted[sorted.length - 1].timestampMs));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationHistory]);

  // When selected day changes, reset time range to that full day
  useEffect(() => {
    setFromTime(startOfDay(selectedDay));
    setToTime(endOfDay(selectedDay));
  }, [selectedDay]);

  const filteredSorted = useMemo(() => {
    const dayStart = startOfDay(selectedDay).getTime();
    const dayEnd = endOfDay(selectedDay).getTime();
    const from = Math.max(dayStart, fromTime.getTime());
    const to = Math.min(dayEnd, toTime.getTime());
    return sorted.filter((e) => e.timestampMs >= from && e.timestampMs <= to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationHistory, selectedDay, fromTime, toTime]);

  const viewerPoints = useMemo<LocationHistoryPoint[]>(
    () =>
      filteredSorted.map((point) => ({
        id: `${point.timestampMs}-${point.latitudeDeg}-${point.longitudeDeg}`,
        latitude: point.latitudeDeg,
        longitude: point.longitudeDeg,
        timestamp: point.timestampMs,
        accuracy: point.accuracyMeter,
        speedKmh: point.velocityMps ? point.velocityMps * 3.6 : null,
      })),
    [filteredSorted],
  );

  const onDayChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowDayPicker(Platform.OS === "ios");
    if (date) setSelectedDay(date);
  };

  const onFromChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowFromPicker(Platform.OS === "ios");
    if (date) setFromTime(date);
  };

  const onToChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowToPicker(Platform.OS === "ios");
    if (date) setToTime(date);
  };

  useEffect(() => {
    if (!showHistoryModal) {
      closeFilterSheet();
    }
  }, [showHistoryModal, closeFilterSheet]);

  useEffect(() => {
    if (!follower || hasFetchedHistoryRef.current) {
      return;
    }

    hasFetchedHistoryRef.current = true;

    if (!follower.familyCircleId) {
      console.warn(
        "No familyCircleId found on follower; skipping history fetch",
      );
      return;
    }

    const fetchHistory = async () => {
      try {
        const response = await listFamilyMemberLocationHistory(
          follower.familyCircleId as string,
          follower.id,
        );
        setLocationHistory(response.locationsList);
      } catch (error: any) {
        console.warn("Failed to fetch follower history:", error?.message);
      }
    };

    fetchHistory();
  }, [follower]);

  if (!follower) {
    console.warn("FollowerBottomSheet rendered without follower");
    return null;
  }

  const getActivityState = (speed: number | null | undefined) => {
    if (speed == null) return { label: t.stationary, icon: "pause-circle-outline" as const };
    if (speed < 2) return { label: t.stationary, icon: "pause-circle-outline" as const };
    if (speed <= 10) return { label: t.walking, icon: "walk-outline" as const };
    return { label: t.driving, icon: "car-outline" as const };
  };
  const activity = getActivityState(speedKmh);
  const battery = follower.batteryLevel;

  return (
    <BottomSheetView style={styles.sheetContainer}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <Pressable onPress={() => setShowHistoryModal(true)} style={styles.avatarFallback}>
            <Text style={styles.avatarLetter}>
              {follower.name.trim().charAt(0).toUpperCase() || "F"}
            </Text>
          </Pressable>
          <View style={styles.nameBlock}>
            <Text style={styles.title}>{follower.name}</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{t.activeNow}</Text>
            </View>
          </View>
          <View style={styles.actionBtns}>
            <Pressable style={styles.actionBtn} onPress={onChatPress}>
              <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={onCallPress}>
              <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.locationRow}>
          <View style={styles.locationIconWrap}>
            <Ionicons name="location" size={14} color={colors.primary} />
          </View>
          <View style={styles.locationTexts}>
            <Text style={styles.locationLabel}>{t.currentLocation}</Text>
            <Text style={styles.locationAddress} numberOfLines={1}>
              {address ?? t.resolvingAddress}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatTile
            icon={activity.icon}
            label={activity.label}
            value={speedKmh != null ? `${speedKmh}` : "—"}
            unit={speedKmh != null ? "km/h" : undefined}
          />
          {battery !== undefined ? (
            <StatTile
              icon="battery-half-outline"
              label={t.battery}
              value={`${battery}`}
              unit="%"
            />
          ) : null}
          {/* <Pressable style={styles.sosBtn} onPress={onSosPress}>
            <Text style={styles.sosBtnText}>{t.sos}</Text>
          </Pressable> */}
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t.nameLabel}</Text>
            <Text style={styles.detailValue}>{follower.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t.coordinatesLabel}</Text>
            <Text style={styles.detailValue}>
              {follower.latitude.toFixed(6)}, {follower.longitude.toFixed(6)}
            </Text>
          </View>

          <View style={styles.detailRowLast}>
            <Text style={styles.detailLabel}>{t.lastUpdatedLabel}</Text>
            <Text style={styles.detailValue}>
              {follower.lastActive ? new Date(follower.lastActive).toLocaleString() : t.notAvailable}
            </Text>
          </View>
        </View>

        <Button
          color={colors.warn}
          title={t.reportMissing}
          onPress={() => {
            router.push({
              pathname: "/(app)/create-missing",
              params: {
                initialName: follower.name,
                initialLat: follower.latitude.toString(),
                initialLng: follower.longitude.toString(),
                initialAvatar: follower.avatar || "",
              },
            });
          }}
        />
      </View>

      <Modal
        visible={showHistoryModal}
        animationType="slide"
        onRequestClose={() => {
          closeFilterSheet();
          setShowHistoryModal(false);
        }}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.historyHeader}>
            <Text style={styles.modalTitle}>
              {t.historyTitleWithName.replace("{{name}}", follower.name)}
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Pressable
                style={styles.headerIconBtn}
                onPress={openFilterSheet}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t.filterHistoryButton}
              >
                <Ionicons name="funnel-outline" size={20} color="#74becb" />
              </Pressable>
              <Pressable
                onPress={() => {
                  closeFilterSheet();
                  setShowHistoryModal(false);
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t.closeHistoryButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>
          </View>

          <LocationHistoryViewer
            points={viewerPoints}
            emptyText={t.noLocationHistoryAvailable}
            centerButtonLabel={t.centerOnStart}
            pointSingularLabel={t.pointSingular}
            pointPluralLabel={t.pointPlural}
            // listMaxHeight={220}
            mapMarginBottom={0}
            fitDelayMs={300}
          />
        </View>
      </Modal>

      {/* Filter bottom sheet */}
      <BottomSheetModal
        ref={filterSheetRef}
        enableDynamicSizing={true}
        maxDynamicContentSize={Math.floor(screenHeight * 0.8)}
        enablePanDownToClose
        handleIndicatorStyle={styles.filterSheetHandle}
        backgroundStyle={styles.filterSheetBackground}
        onDismiss={() => {
          setShowDayPicker(false);
          setShowFromPicker(false);
          setShowToPicker(false);
        }}
      >
        <BottomSheetScrollView
          style={styles.filterSheet}
          contentContainerStyle={styles.filterSheetContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.filterSheetTitle}>{t.filterHistoryTitle}</Text>

          {/* Day selector */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>{t.dayLabel}</Text>
            <Pressable
              style={styles.filterPill}
              onPress={() => setShowDayPicker(true)}
            >
              <Ionicons name="calendar-outline" size={14} color="#74becb" />
              <Text style={styles.filterPillText}>
                {formatDate(selectedDay)}
              </Text>
            </Pressable>
          </View>

          {/* Time range */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>{t.fromLabel}</Text>
            <Pressable
              style={styles.filterPill}
              onPress={() => setShowFromPicker(true)}
            >
              <Ionicons name="time-outline" size={14} color="#74becb" />
              <Text style={styles.filterPillText}>
                {fromTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </Pressable>
            <Text style={styles.filterSep}>→</Text>
            <Pressable
              style={styles.filterPill}
              onPress={() => setShowToPicker(true)}
            >
              <Ionicons name="time-outline" size={14} color="#74becb" />
              <Text style={styles.filterPillText}>
                {toTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </Pressable>
          </View>

          {/* Quick-jump chips for available days */}
          {availableDays.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 4 }}
              contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
            >
              {availableDays.map((day) => {
                const active =
                  startOfDay(day).getTime() ===
                  startOfDay(selectedDay).getTime();
                return (
                  <Pressable
                    key={day.getTime()}
                    style={[styles.dayChip, active && styles.dayChipActive]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayChipText,
                        active && styles.dayChipTextActive,
                      ]}
                    >
                      {formatDate(day)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {showDayPicker && (
            <DateTimePicker
              value={selectedDay}
              mode="date"
              maximumDate={new Date()}
              onChange={onDayChange}
            />
          )}
          {showFromPicker && (
            <DateTimePicker
              value={fromTime}
              mode="time"
              onChange={onFromChange}
            />
          )}
          {showToPicker && (
            <DateTimePicker value={toTime} mode="time" onChange={onToChange} />
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </BottomSheetView>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  avatarLetter: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  nameBlock: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8fafc",
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  locationIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${colors.primary}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  locationTexts: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  locationAddress: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "500",
    marginTop: 1,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "stretch",
  },
  statTile: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: radii.md,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  statIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  statUnit: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  detailCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
  },
  detailRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 4,
  },
  detailRowLast: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  actionBtns: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sosBtn: {
    width: 52,
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  sosBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
    marginRight: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f7fa",
    alignItems: "center",
    justifyContent: "center",
  },
  filterSheet: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  filterSheetContent: {
    paddingBottom: 32,
    gap: 12,
  },
  filterSheetBackground: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  filterSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  filterSheetTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    width: 36,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f0f7fa",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#c7e8f0",
  },
  filterPillText: {
    fontSize: 13,
    color: "#0f172a",
    fontWeight: "500",
  },
  filterSep: { fontSize: 14, color: "#94a3b8" },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
  },
  dayChipActive: {
    backgroundColor: "#74becb",
    borderColor: "#74becb",
  },
  dayChipText: { fontSize: 12, color: "#374151" },
  dayChipTextActive: { color: "#fff", fontWeight: "600" },
});
