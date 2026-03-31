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
}: {
  follower: Follower | null;
}) => {
  const t = useTranslation(followerBottomSheetLang);
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

  return (
    <BottomSheetView
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 24,
        gap: 12,
      }}
    >
      <Pressable
        onPress={() => setShowHistoryModal(true)}
        style={styles.infoPress}
      >
        <FollowerInfo
          follower={follower}
          width={100}
          height={100}
          standMode="detailed"
        />
      </Pressable>

      <Button
        color="#d97706"
        title={t.reportMissing}
        onPress={() => {
          Alert.alert(t.reportSubmitted, t.thankYou);
        }}
      />

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
  infoPress: {
    alignItems: "center",
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
