import { MOCK_CRIME_REPORTS } from "@/constant/mockCrimeReports";
import { CrimeReport, DangerStatus } from "@/constant/types";
import useDeviceLocation from "@/hooks/useDeviceLocation";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, {
  Circle,
  Marker,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

type ReportWithDistance = {
  report: CrimeReport;
  distanceKm: number;
};

const USER_AREA_RADIUS_KM = 10;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function distanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const earthRadiusKm = 6371;
  const latDiff = toRadians(toLat - fromLat);
  const lngDiff = toRadians(toLng - fromLng);

  const a =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(lngDiff / 2) *
      Math.sin(lngDiff / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getDangerPalette(status: DangerStatus): {
  stroke: string;
  fill: string;
  marker: string;
} {
  switch (status) {
    case "low":
      return {
        stroke: "rgba(34, 197, 94, 0.95)",
        fill: "rgba(34, 197, 94, 0.18)",
        marker: "#22c55e",
      };
    case "medium":
      return {
        stroke: "rgba(245, 158, 11, 0.95)",
        fill: "rgba(245, 158, 11, 0.2)",
        marker: "#f59e0b",
      };
    case "high":
      return {
        stroke: "rgba(239, 68, 68, 0.95)",
        fill: "rgba(239, 68, 68, 0.2)",
        marker: "#ef4444",
      };
    default:
      return {
        stroke: "rgba(127, 29, 29, 0.98)",
        fill: "rgba(127, 29, 29, 0.25)",
        marker: "#7f1d1d",
      };
  }
}

function dangerRank(status: DangerStatus): number {
  switch (status) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

function viewportRadiusKm(region: Region): number {
  const kmPerLatDegree = 111;
  const kmPerLngDegree = 111 * Math.cos((region.latitude * Math.PI) / 180);
  const latRadiusKm = (region.latitudeDelta * kmPerLatDegree) / 2;
  const lngRadiusKm = (region.longitudeDelta * kmPerLngDegree) / 2;
  return Math.sqrt(latRadiusKm * latRadiusKm + lngRadiusKm * lngRadiusKm);
}

export default function CrimeHeatmapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const reportsRef = useRef(MOCK_CRIME_REPORTS);
  const { location } = useDeviceLocation(false);

  const [visibleRegion, setVisibleRegion] = useState<Region | null>(null);
  const [selectedRegionRadiusKm, setSelectedRegionRadiusKm] = useState(3);
  const [useCustomRadius, setUseCustomRadius] = useState(false);

  const initialRegion = useMemo(() => {
    if (location) {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.11,
        longitudeDelta: 0.11,
      };
    }

    return {
      latitude: reportsRef.current[0].latitude,
      longitude: reportsRef.current[0].longitude,
      latitudeDelta: 0.11,
      longitudeDelta: 0.11,
    };
  }, [location]);

  const reportsAroundUser = useMemo(() => {
    if (!location) {
      return reportsRef.current.map((report) => ({
        report,
        distanceKm: Number.POSITIVE_INFINITY,
      }));
    }

    return reportsRef.current
      .map((report) => ({
        report,
        distanceKm: distanceKm(
          location.latitude,
          location.longitude,
          report.latitude,
          report.longitude,
        ),
      }))
      .filter((item) => item.distanceKm <= USER_AREA_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [location]);

  const regionCenter = useMemo(() => {
    const activeRegion = visibleRegion ?? initialRegion;
    return {
      latitude: activeRegion.latitude,
      longitude: activeRegion.longitude,
    };
  }, [visibleRegion, initialRegion]);

  const autoRadiusKm = useMemo(() => {
    const activeRegion = visibleRegion ?? initialRegion;
    return viewportRadiusKm(activeRegion);
  }, [visibleRegion, initialRegion]);

  const effectiveRegionRadiusKm = useMemo(() => {
    return useCustomRadius ? selectedRegionRadiusKm : autoRadiusKm;
  }, [useCustomRadius, selectedRegionRadiusKm, autoRadiusKm]);

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
    const criminalCount = regionReports.reduce(
      (sum, item) => sum + item.report.numberOfCriminals,
      0,
    );

    const highestDanger = regionReports.reduce<DangerStatus>(
      (best, item) =>
        dangerRank(item.report.dangerStatus) > dangerRank(best)
          ? item.report.dangerStatus
          : best,
      "low",
    );

    return {
      incidents: regionReports.length,
      criminals: criminalCount,
      highestDanger,
    };
  }, [regionReports]);

  const renderReport = ({ item }: { item: ReportWithDistance }) => {
    const palette = getDangerPalette(item.report.dangerStatus);

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
            <Ionicons name="warning" size={18} color={palette.marker} />
            <View style={{ flex: 1 }}>
              <Text style={styles.reportTitle}>{item.report.title}</Text>
              <Text style={styles.reportMeta}>
                {item.report.incidentType} • {item.report.numberOfCriminals}{" "}
                criminal(s)
              </Text>
            </View>
          </View>
          <Text style={[styles.statusBadge, { color: palette.marker }]}>
            {item.report.dangerStatus.toUpperCase()}
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
            Shows criminal actions within 10km around your area
          </Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{regionalSummary.incidents}</Text>
          <Text style={styles.summaryLabel}>Incidents</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{regionalSummary.criminals}</Text>
          <Text style={styles.summaryLabel}>Criminals</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {regionalSummary.highestDanger.toUpperCase()}
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
        // cacheEnabled={true}
      >
        {reportsAroundUser.map(({ report }) => {
          const palette = getDangerPalette(report.dangerStatus);
          const radius = 220 + report.numberOfCriminals * 45;
          return (
            <Circle
              key={`heat-${report.id}`}
              center={{
                latitude: report.latitude,
                longitude: report.longitude,
              }}
              radius={radius}
              strokeColor={palette.stroke}
              fillColor={palette.fill}
              strokeWidth={2}
            />
          );
        })}

        {reportsAroundUser.map(({ report }) => {
          const palette = getDangerPalette(report.dangerStatus);
          return (
            <Marker
              key={`crime-${report.id}`}
              coordinate={{
                latitude: report.latitude,
                longitude: report.longitude,
              }}
              title={report.title}
              description={`${report.incidentType} • ${report.numberOfCriminals} criminal(s)`}
              pinColor={palette.marker}
            />
          );
        })}

        {location ? (
          <Circle
            center={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            radius={USER_AREA_RADIUS_KM * 1000}
            strokeColor="rgba(37, 99, 235, 0.9)"
            fillColor="rgba(37, 99, 235, 0.08)"
            strokeWidth={2}
          />
        ) : null}

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
          Region by viewport center ({effectiveRegionRadiusKm.toFixed(2)}km)
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
            {useCustomRadius ? "Custom Radius: On" : "Custom Radius: Off"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.radiusControlsSecondary}>
        <Text style={styles.radiusLabel}>Custom radius:</Text>
        {[1, 3, 5].map((radiusKm) => (
          <Pressable
            key={radiusKm}
            style={[
              styles.radiusButton,
              selectedRegionRadiusKm === radiusKm && styles.radiusButtonActive,
              !useCustomRadius && styles.radiusButtonDisabled,
            ]}
            onPress={() => setSelectedRegionRadiusKm(radiusKm)}
            disabled={!useCustomRadius}
          >
            <Text
              style={[
                styles.radiusButtonText,
                selectedRegionRadiusKm === radiusKm &&
                  styles.radiusButtonTextActive,
              ]}
            >
              {radiusKm}km
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
              No crime report found in this region.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#4b5563",
  },
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
  summaryValue: {
    fontWeight: "700",
    color: "#0f172a",
    fontSize: 14,
  },
  summaryLabel: {
    marginTop: 2,
    fontSize: 11,
    color: "#6b7280",
  },
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
  radiusLabel: {
    fontSize: 12,
    color: "#4b5563",
    marginRight: 4,
  },
  modeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  modeButtonActive: {
    backgroundColor: "#0f766e",
    borderColor: "#0f766e",
  },
  modeButtonText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
  },
  modeButtonTextActive: {
    color: "#ffffff",
  },
  radiusButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#fff",
  },
  radiusButtonActive: {
    backgroundColor: "#0f766e",
    borderColor: "#0f766e",
  },
  radiusButtonDisabled: {
    opacity: 0.45,
  },
  radiusButtonText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
  },
  radiusButtonTextActive: {
    color: "#ffffff",
  },
  list: {
    flex: 1,
    marginTop: 6,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8,
  },
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
  reportLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  reportMeta: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: "700",
  },
  reportDistance: {
    marginTop: 6,
    fontSize: 12,
    color: "#475569",
  },
  emptyWrap: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 13,
  },
});
