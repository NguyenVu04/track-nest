import {
  criminalReportsService,
  CrimeReport as BackendCrimeReport,
  getSeverityLabel,
  getSeverityColor,
} from "@/services/criminalReports";
import useDeviceLocation from "@/hooks/useDeviceLocation";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, {
  Circle,
  Marker,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

type ReportWithDistance = {
  report: BackendCrimeReport;
  distanceKm: number;
};

const USER_AREA_RADIUS_KM = 10;
const USER_AREA_RADIUS_M = USER_AREA_RADIUS_KM * 1000;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function distanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const R = 6371;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function viewportRadiusKm(region: Region): number {
  const kmPerLatDeg = 111;
  const kmPerLngDeg = 111 * Math.cos((region.latitude * Math.PI) / 180);
  const latR = (region.latitudeDelta * kmPerLatDeg) / 2;
  const lngR = (region.longitudeDelta * kmPerLngDeg) / 2;
  return Math.sqrt(latR * latR + lngR * lngR);
}

function getSeverityStrokeColor(severity: number): string {
  if (severity >= 4) return "rgba(239, 68, 68, 0.95)";
  if (severity >= 2) return "rgba(245, 158, 11, 0.95)";
  return "rgba(34, 197, 94, 0.95)";
}

function getSeverityFillColor(severity: number): string {
  if (severity >= 4) return "rgba(239, 68, 68, 0.2)";
  if (severity >= 2) return "rgba(245, 158, 11, 0.2)";
  return "rgba(34, 197, 94, 0.18)";
}

function getSeverityMarkerColor(severity: number): string {
  if (severity >= 4) return "#ef4444";
  if (severity >= 2) return "#f59e0b";
  return "#22c55e";
}

export default function CrimeHeatmapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { location } = useDeviceLocation(false);

  const [reports, setReports] = useState<BackendCrimeReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibleRegion, setVisibleRegion] = useState<Region | null>(null);
  const [selectedRegionRadiusKm, setSelectedRegionRadiusKm] = useState(3);
  const [useCustomRadius, setUseCustomRadius] = useState(false);

  const initialRegion = useMemo(() => {
    const lat = location?.latitude ?? 10.7769;
    const lng = location?.longitude ?? 106.6424;
    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.11,
      longitudeDelta: 0.11,
    };
  }, [location]);

  const loadReports = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    try {
      const result = await criminalReportsService.getCrimeHeatmap(
        location.longitude,
        location.latitude,
        USER_AREA_RADIUS_M,
        0,
        50,
      );
      setReports(result.content);
    } catch (err) {
      console.error("Failed to load crime heatmap:", err);
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const reportsAroundUser = useMemo(() => {
    if (!location)
      return reports.map((r) => ({ report: r, distanceKm: Infinity }));
    return reports
      .map((r) => ({
        report: r,
        distanceKm: distanceKm(
          location.latitude,
          location.longitude,
          r.latitude,
          r.longitude,
        ),
      }))
      .filter((item) => item.distanceKm <= USER_AREA_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [reports, location]);

  const regionCenter = useMemo(() => {
    const active = visibleRegion ?? initialRegion;
    return { latitude: active.latitude, longitude: active.longitude };
  }, [visibleRegion, initialRegion]);

  const autoRadiusKm = useMemo(() => {
    return viewportRadiusKm(visibleRegion ?? initialRegion);
  }, [visibleRegion, initialRegion]);

  const effectiveRegionRadiusKm = useCustomRadius
    ? selectedRegionRadiusKm
    : autoRadiusKm;

  const regionReports = useMemo(() => {
    return reportsAroundUser
      .map((item) => ({
        report: item.report,
        distanceKm: distanceKm(
          regionCenter.latitude,
          regionCenter.longitude,
          item.report.latitude,
          item.report.longitude,
        ),
      }))
      .filter((item) => item.distanceKm <= effectiveRegionRadiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [reportsAroundUser, regionCenter, effectiveRegionRadiusKm]);

  const regionalSummary = useMemo(() => {
    const highestSeverity = regionReports.reduce(
      (max, item) => Math.max(max, item.report.severity),
      0,
    );
    return {
      incidents: regionReports.length,
      victims: regionReports.reduce(
        (sum, item) => sum + (item.report.numberOfVictims ?? 0),
        0,
      ),
      highestSeverityLabel:
        highestSeverity > 0 ? getSeverityLabel(highestSeverity) : "N/A",
      highestSeverity,
    };
  }, [regionReports]);

  const renderReport = ({ item }: { item: ReportWithDistance }) => {
    const markerColor = getSeverityMarkerColor(item.report.severity);
    const severityLabel = getSeverityLabel(item.report.severity);

    return (
      <Pressable
        style={styles.reportCard}
        onPress={() => {
          mapRef.current?.animateToRegion(
            {
              latitude: item.report.latitude,
              longitude: item.report.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            },
            350,
          );
        }}
      >
        <View style={styles.reportRow}>
          <View style={styles.reportLeft}>
            <Ionicons name="warning" size={18} color={markerColor} />
            <View style={{ flex: 1 }}>
              <Text style={styles.reportTitle}>{item.report.title}</Text>
              <Text style={styles.reportMeta}>
                Victims: {item.report.numberOfVictims ?? 0} • Offenders:{" "}
                {item.report.numberOfOffenders ?? 0}
              </Text>
            </View>
          </View>
          <Text style={[styles.statusBadge, { color: markerColor }]}>
            {severityLabel.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.reportDistance}>
          {Number.isFinite(item.distanceKm)
            ? `${item.distanceKm.toFixed(2)} km away`
            : "Distance unavailable"}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Crime Heatmap</Text>
          <Text style={styles.subtitle}>
            Crime reports within {USER_AREA_RADIUS_KM}km of your area
          </Text>
        </View>
        <Pressable
          onPress={loadReports}
          style={styles.backBtn}
          hitSlop={8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#74becb" />
          ) : (
            <Ionicons name="refresh" size={20} color="#0f172a" />
          )}
        </Pressable>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{regionalSummary.incidents}</Text>
          <Text style={styles.summaryLabel}>Incidents</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{regionalSummary.victims}</Text>
          <Text style={styles.summaryLabel}>Victims</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text
            style={[
              styles.summaryValue,
              {
                color: getSeverityMarkerColor(regionalSummary.highestSeverity),
              },
            ]}
          >
            {regionalSummary.highestSeverityLabel.toUpperCase()}
          </Text>
          <Text style={styles.summaryLabel}>Danger</Text>
        </View>
      </View>

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        onRegionChangeComplete={setVisibleRegion}
      >
        {reportsAroundUser.map(({ report }) => (
          <Circle
            key={`heat-${report.id}`}
            center={{ latitude: report.latitude, longitude: report.longitude }}
            radius={220 + report.severity * 45}
            strokeColor={getSeverityStrokeColor(report.severity)}
            fillColor={getSeverityFillColor(report.severity)}
            strokeWidth={2}
          />
        ))}

        {reportsAroundUser.map(({ report }) => (
          <Marker
            key={`crime-${report.id}`}
            coordinate={{
              latitude: report.latitude,
              longitude: report.longitude,
            }}
            title={report.title}
            description={`Severity: ${getSeverityLabel(report.severity)} • Victims: ${report.numberOfVictims ?? 0}`}
            pinColor={getSeverityMarkerColor(report.severity)}
          />
        ))}

        {location && (
          <Circle
            center={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            radius={USER_AREA_RADIUS_M}
            strokeColor="rgba(37, 99, 235, 0.9)"
            fillColor="rgba(37, 99, 235, 0.08)"
            strokeWidth={2}
          />
        )}

        <Circle
          center={regionCenter}
          radius={effectiveRegionRadiusKm * 1000}
          strokeColor="rgba(20, 184, 166, 0.95)"
          fillColor="rgba(20, 184, 166, 0.15)"
          strokeWidth={2}
        />
      </MapView>

      <View style={styles.radiusControls}>
        <Text style={styles.radiusLabel}>
          Region ({effectiveRegionRadiusKm.toFixed(2)}km)
        </Text>
        <Pressable
          style={[
            styles.modeButton,
            useCustomRadius && styles.modeButtonActive,
          ]}
          onPress={() => setUseCustomRadius((prev) => !prev)}
        >
          <Text
            style={[
              styles.modeButtonText,
              useCustomRadius && styles.modeButtonTextActive,
            ]}
          >
            {useCustomRadius ? "Custom: On" : "Custom: Off"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.radiusControlsSecondary}>
        <Text style={styles.radiusLabel}>Custom radius:</Text>
        {[1, 3, 5].map((r) => (
          <Pressable
            key={r}
            style={[
              styles.radiusButton,
              selectedRegionRadiusKm === r && styles.radiusButtonActive,
              !useCustomRadius && styles.radiusButtonDisabled,
            ]}
            onPress={() => setSelectedRegionRadiusKm(r)}
            disabled={!useCustomRadius}
          >
            <Text
              style={[
                styles.radiusButtonText,
                selectedRegionRadiusKm === r && styles.radiusButtonTextActive,
              ]}
            >
              {r}km
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={regionReports}
        keyExtractor={(item) => item.report.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={renderReport}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              {loading
                ? "Loading..."
                : "No crime reports found in this region."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backBtn: { width: 32, height: 32, justifyContent: "center" },
  headerTextWrap: { flex: 1 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  subtitle: { marginTop: 2, fontSize: 12, color: "#4b5563" },
  summaryRow: {
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 10,
    alignItems: "center",
  },
  summaryValue: { fontWeight: "700", color: "#0f172a", fontSize: 14 },
  summaryLabel: { marginTop: 2, fontSize: 11, color: "#6b7280" },
  map: {
    height: "40%",
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: "hidden",
  },
  radiusControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  radiusControlsSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  radiusLabel: { fontSize: 12, color: "#4b5563", marginRight: 4 },
  modeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  modeButtonActive: { backgroundColor: "#0f766e", borderColor: "#0f766e" },
  modeButtonText: { color: "#334155", fontSize: 12, fontWeight: "600" },
  modeButtonTextActive: { color: "#ffffff" },
  radiusButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#fff",
  },
  radiusButtonActive: { backgroundColor: "#0f766e", borderColor: "#0f766e" },
  radiusButtonDisabled: { opacity: 0.45 },
  radiusButtonText: { color: "#334155", fontSize: 12, fontWeight: "600" },
  radiusButtonTextActive: { color: "#ffffff" },
  list: { flex: 1, marginTop: 6 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
  reportCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    padding: 12,
  },
  reportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  reportLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  reportTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  reportMeta: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  statusBadge: { fontSize: 11, fontWeight: "700" },
  reportDistance: { marginTop: 6, fontSize: 12, color: "#475569" },
  emptyWrap: { paddingVertical: 20, alignItems: "center" },
  emptyText: { color: "#6b7280", fontSize: 13 },
});
