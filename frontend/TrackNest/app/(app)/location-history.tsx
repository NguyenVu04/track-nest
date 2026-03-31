import {
  LocationHistoryPoint,
  LocationHistoryViewer,
} from "@/components/LocationHistoryViewer";
import { LOCATION_HISTORY_KEY } from "@/constant";
import { locationHistory as locationHistoryLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { loadSavedKey } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type HistoryEntry = {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  timestamp: number;
  time_spent?: number;
};

// ── helpers ──────────────────────────────────────────────────────────────────

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

// ── component ─────────────────────────────────────────────────────────────────

export default function LocationHistoryScreen() {
  const router = useRouter();
  const t = useTranslation(locationHistoryLang);

  const [allHistory, setAllHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected day
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [showDayPicker, setShowDayPicker] = useState(false);

  // Time range within the selected day
  const [fromTime, setFromTime] = useState<Date>(startOfDay(new Date()));
  const [toTime, setToTime] = useState<Date>(endOfDay(new Date()));
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const loadHistory = async () => {
    setIsLoading(true);
    const data = await loadSavedKey<HistoryEntry[]>(LOCATION_HISTORY_KEY);
    setAllHistory(data ?? []);
    setIsLoading(false);
  };

  // ── load history from storage ──────────────────────────────────────────────

  useEffect(() => {
    loadHistory();
  }, []);

  // ── when selected day changes, reset time range to that full day ───────────

  useEffect(() => {
    setFromTime(startOfDay(selectedDay));
    setToTime(endOfDay(selectedDay));
  }, [selectedDay]);

  // ── distinct days that have recorded data ─────────────────────────────────

  const availableDays = useMemo(() => {
    const daySet = new Set<string>();
    allHistory.forEach((e) => {
      daySet.add(startOfDay(new Date(e.timestamp)).toDateString());
    });
    return Array.from(daySet)
      .map((s) => new Date(s))
      .sort((a, b) => b.getTime() - a.getTime()); // newest first
  }, [allHistory]);

  // ── filtered points ────────────────────────────────────────────────────────

  const filteredPoints = useMemo(() => {
    const dayStart = startOfDay(selectedDay).getTime();
    const dayEnd = endOfDay(selectedDay).getTime();
    // Combine day boundary with custom time range
    const from = Math.max(dayStart, fromTime.getTime());
    const to = Math.min(dayEnd, toTime.getTime());

    return allHistory
      .filter((e) => e.timestamp >= from && e.timestamp <= to)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [allHistory, selectedDay, fromTime, toTime]);

  // ── picker handlers ────────────────────────────────────────────────────────

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

  const viewerPoints = useMemo<LocationHistoryPoint[]>(
    () =>
      filteredPoints.map((point) => ({
        id: `${point.timestamp}-${point.latitude}-${point.longitude}`,
        latitude: point.latitude,
        longitude: point.longitude,
        timestamp: point.timestamp,
        accuracy: point.accuracy,
        speedKmh: point.speed ? point.speed * 3.6 : null,
        timeSpentSeconds: point.time_spent ?? null,
      })),
    [filteredPoints],
  );

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </Pressable>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <Pressable
          onPress={loadHistory}
          style={styles.refreshBtn}
          hitSlop={8}
          disabled={isLoading}
        >
          {isLoading ? (
            <Ionicons name="hourglass-outline" size={20} color="#74becb" />
          ) : (
            <Ionicons name="refresh" size={20} color="#0f172a" />
          )}
        </Pressable>
      </View>

      {/* Filters */}
      <View style={styles.filtersCard}>
        {/* Day selector */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>{t.dayLabel}</Text>
          <Pressable
            style={styles.filterPill}
            onPress={() => setShowDayPicker(true)}
          >
            <Ionicons name="calendar-outline" size={14} color="#74becb" />
            <Text style={styles.filterPillText}>{formatDate(selectedDay)}</Text>
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

        {/* Quick-jump buttons for available days */}
        {availableDays.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 8 }}
            contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
          >
            {availableDays.map((day) => {
              const active =
                startOfDay(day).getTime() === startOfDay(selectedDay).getTime();
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
      </View>

      {/* Pickers */}
      {showDayPicker && (
        <DateTimePicker
          value={selectedDay}
          mode="date"
          maximumDate={new Date()}
          onChange={onDayChange}
        />
      )}
      {showFromPicker && (
        <DateTimePicker value={fromTime} mode="time" onChange={onFromChange} />
      )}
      {showToPicker && (
        <DateTimePicker value={toTime} mode="time" onChange={onToChange} />
      )}

      <LocationHistoryViewer
        points={viewerPoints}
        isLoading={isLoading}
        emptyText={t.noDataForPeriod}
        centerButtonLabel={t.centerOnStart}
        pointSingularLabel={t.pointSingular}
        pointPluralLabel={t.pointPlural}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backBtn: { width: 32 },
  refreshBtn: {
    width: 32,
    alignItems: "flex-end",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#0f172a" },
  filtersCard: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
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
