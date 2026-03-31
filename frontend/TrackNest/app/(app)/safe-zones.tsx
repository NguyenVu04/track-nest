import { MOCK_SAFE_ZONES } from "@/constant/mockSafeZones";
import { SafeZone } from "@/constant/types";
import useDeviceLocation from "@/hooks/useDeviceLocation";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function getDistanceInKm(
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

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

type SafeZoneDistance = {
  zone: SafeZone;
  distanceKm: number;
};

export default function SafeZonesScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const safeZonesRef = useRef(MOCK_SAFE_ZONES);
  const [searchQuery, setSearchQuery] = useState("");
  const { location } = useDeviceLocation(false);

  const initialRegion = useMemo(() => {
    if (location) {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }

    const first = safeZonesRef.current[0];
    return {
      latitude: first.latitude,
      longitude: first.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }, [location]);

  const safeZonesWithDistance = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const filtered = safeZonesRef.current.filter((zone) =>
      zone.name.toLowerCase().includes(normalizedSearch),
    );

    const withDistance: SafeZoneDistance[] = filtered.map((zone) => {
      if (!location) {
        return { zone, distanceKm: Number.POSITIVE_INFINITY };
      }

      return {
        zone,
        distanceKm: getDistanceInKm(
          location.latitude,
          location.longitude,
          zone.latitude,
          zone.longitude,
        ),
      };
    });

    return withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
  }, [searchQuery, location]);

  const handleFocusZone = (zone: SafeZone) => {
    mapRef.current?.animateToRegion(
      {
        latitude: zone.latitude,
        longitude: zone.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      350,
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
          <Text style={styles.title}>Safe Zones</Text>
          <Text style={styles.subtitle}>
            Search and browse nearest safe areas
          </Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search safe zone by name"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsCompass={false}
        // cacheEnabled={true}
      >
        {safeZonesRef.current.map((zone) => (
          <Circle
            key={`safe-zone-area-${zone.id}`}
            center={{ latitude: zone.latitude, longitude: zone.longitude }}
            radius={zone.radiusMeters}
            strokeColor="rgba(46, 204, 113, 0.85)"
            fillColor="rgba(46, 204, 113, 0.18)"
            strokeWidth={2}
          />
        ))}

        {safeZonesRef.current.map((zone) => (
          <Marker
            key={`safe-zone-marker-${zone.id}`}
            coordinate={{ latitude: zone.latitude, longitude: zone.longitude }}
            title={zone.name}
            description={`Safe radius: ${zone.radiusMeters}m`}
            pinColor="#2ecc71"
            onPress={() => handleFocusZone(zone)}
          />
        ))}
      </MapView>

      <FlatList
        data={safeZonesWithDistance}
        keyExtractor={(item) => item.zone.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            style={styles.item}
            onPress={() => handleFocusZone(item.zone)}
            android_ripple={{ color: "#dcfce7" }}
          >
            <View style={styles.itemMain}>
              <Ionicons name="shield-checkmark" size={18} color="#16a34a" />
              <View style={styles.itemTextWrap}>
                <Text style={styles.itemTitle}>{item.zone.name}</Text>
                <Text style={styles.itemMeta}>
                  Radius {item.zone.radiusMeters}m
                </Text>
              </View>
            </View>
            <Text style={styles.distanceText}>
              {Number.isFinite(item.distanceKm)
                ? `${item.distanceKm.toFixed(2)} km`
                : "--"}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No safe zone found.</Text>
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
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 13,
    color: "#475569",
    marginTop: 2,
  },
  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: "#0f172a",
    fontSize: 14,
  },
  map: {
    height: "42%",
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: "hidden",
  },
  list: {
    flex: 1,
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 8,
  },
  item: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  itemTextWrap: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  itemMeta: {
    marginTop: 2,
    fontSize: 12,
    color: "#6b7280",
  },
  distanceText: {
    fontSize: 12,
    color: "#0f766e",
    fontWeight: "600",
    marginLeft: 12,
  },
  emptyWrap: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#6b7280",
  },
});
