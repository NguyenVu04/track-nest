import { formatAddressFromLatLng, formatRelativeTime } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, Polyline, Region } from "react-native-maps";

export type LocationHistoryPoint = {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number | null;
  speedKmh?: number | null;
  timeSpentSeconds?: number | null;
};

type OrderedHistoryPoint = LocationHistoryPoint & {
  order: number;
  isStart: boolean;
  isEnd: boolean;
};

type LocationHistoryViewerProps = {
  points: LocationHistoryPoint[];
  isLoading?: boolean;
  emptyText: string;
  centerButtonLabel: string;
  pointSingularLabel?: string;
  pointPluralLabel?: string;
  listMaxHeight?: number;
  mapMarginBottom?: number;
  fitDelayMs?: number;
};

function regionForCoords(points: LocationHistoryPoint[]): Region | undefined {
  if (points.length === 0) return undefined;
  const lats = points.map((point) => point.latitude);
  const lngs = points.map((point) => point.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const padding = 0.002;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(maxLat - minLat + padding, 0.01),
    longitudeDelta: Math.max(maxLng - minLng + padding, 0.01),
  };
}

function formatPointTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(totalSeconds: number) {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

export function LocationHistoryViewer({
  points,
  isLoading = false,
  emptyText,
  centerButtonLabel,
  pointSingularLabel = "point",
  pointPluralLabel = "points",
  listMaxHeight,
  mapMarginBottom = 12,
  fitDelayMs = 0,
}: LocationHistoryViewerProps) {
  const mapRef = useRef<MapView>(null);
  const listRef = useRef<FlatList<OrderedHistoryPoint>>(null);
  const [shouldTrackMarkerChanges, setShouldTrackMarkerChanges] =
    useState(true);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);

  const orderedPoints = useMemo<OrderedHistoryPoint[]>(
    () =>
      points.map((point, index) => ({
        ...point,
        order: index + 1,
        isStart: index === 0,
        isEnd: index === points.length - 1,
      })),
    [points],
  );

  const markerPoints = useMemo(() => {
    if (orderedPoints.length <= 2) return orderedPoints;

    const middlePoints = orderedPoints.slice(1, -1);
    const keepCount = Math.max(1, Math.ceil(middlePoints.length * 0.1));
    const step = Math.max(1, Math.floor(middlePoints.length / keepCount));
    const sampledMiddle = middlePoints
      .filter((_, index) => index % step === 0)
      .slice(0, keepCount);

    const sampledPoints = [
      orderedPoints[0],
      ...sampledMiddle,
      orderedPoints[orderedPoints.length - 1],
    ];

    if (!selectedPointId) {
      return sampledPoints;
    }

    const selectedPoint = orderedPoints.find(
      (point) => point.id === selectedPointId,
    );
    if (!selectedPoint) {
      return sampledPoints;
    }

    const hasSelected = sampledPoints.some(
      (point) => point.id === selectedPoint.id,
    );
    return hasSelected ? sampledPoints : [...sampledPoints, selectedPoint];
  }, [orderedPoints, selectedPointId]);

  const polylineCoords = useMemo(
    () =>
      orderedPoints.map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
      })),
    [orderedPoints],
  );

  const startPoint = orderedPoints[0];
  const endPoint = orderedPoints[orderedPoints.length - 1];

  useEffect(() => {
    setShouldTrackMarkerChanges(true);
    const timeoutId = setTimeout(() => {
      setShouldTrackMarkerChanges(false);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [orderedPoints, selectedPointId]);

  useEffect(() => {
    const region = regionForCoords(points);
    if (!region) return;

    const timeoutId = setTimeout(() => {
      mapRef.current?.animateToRegion(region, 400);
    }, fitDelayMs);

    return () => clearTimeout(timeoutId);
  }, [fitDelayMs, points]);

  useEffect(() => {
    setSelectedPointId(startPoint?.id ?? null);
  }, [startPoint?.id]);

  useEffect(() => {
    let cancelled = false;

    const selectedPoint = orderedPoints.find(
      (point) => point.id === selectedPointId,
    );
    if (!selectedPoint) {
      setSelectedAddress("");
      setIsResolvingAddress(false);
      return;
    }

    setIsResolvingAddress(true);
    formatAddressFromLatLng(selectedPoint.latitude, selectedPoint.longitude)
      .then((address) => {
        if (cancelled) return;
        setSelectedAddress(address);
      })
      .catch(() => {
        if (cancelled) return;
        setSelectedAddress("");
      })
      .finally(() => {
        if (cancelled) return;
        setIsResolvingAddress(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderedPoints, selectedPointId]);

  const centerMapOnPoint = (point: LocationHistoryPoint) => {
    mapRef.current?.animateCamera(
      {
        center: {
          latitude: point.latitude,
          longitude: point.longitude,
        },
      },
      { duration: 400 },
    );
  };

  const focusListOnPoint = (pointId: string) => {
    const index = orderedPoints.findIndex((point) => point.id === pointId);
    if (index < 0) return;

    listRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.5,
    });
  };

  const handleCenterOnFirstPoint = () => {
    if (!startPoint) return;
    setSelectedPointId(startPoint.id);
    centerMapOnPoint(startPoint);
  };

  const handleRowPress = (point: LocationHistoryPoint) => {
    setSelectedPointId(point.id);
    centerMapOnPoint(point);
  };

  const handleMarkerPress = (point: OrderedHistoryPoint) => {
    setSelectedPointId(point.id);
    centerMapOnPoint(point);
    focusListOnPoint(point.id);
  };

  const renderHistoryItem = ({ item }: { item: OrderedHistoryPoint }) => {
    const isActive = item.id === selectedPointId;

    return (
      <Pressable
        style={[styles.historyItem, isActive && styles.historyItemActive]}
        onPress={() => handleRowPress(item)}
      >
        <View style={styles.historyIndex}>
          <Text style={styles.historyIndexText}>{item.order}</Text>
        </View>
        <View style={styles.historyDetails}>
          <Text style={styles.historyCoords}>
            {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
          </Text>
          <Text style={styles.historyMeta}>
            {formatRelativeTime(item.timestamp)}
            {item.accuracy ? `  ·  ±${item.accuracy.toFixed(0)} m` : ""}
            {item.speedKmh ? `  ·  ${item.speedKmh.toFixed(1)} km/h` : ""}
            {item.timeSpentSeconds && item.timeSpentSeconds > 0
              ? `  ·  ⏱ ${formatDuration(item.timeSpentSeconds)}`
              : ""}
          </Text>
          {isActive && (
            <Text style={styles.historyAddress} numberOfLines={2}>
              {isResolvingAddress
                ? "Resolving address..."
                : selectedAddress || "No address available"}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.mapContainer, { marginBottom: mapMarginBottom }]}>
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#74becb"
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={
              regionForCoords(points) ?? {
                latitude: 0,
                longitude: 0,
                latitudeDelta: 90,
                longitudeDelta: 180,
              }
            }
            showsUserLocation={false}
            showsMyLocationButton={false}
            // cacheEnabled={true}
          >
            {polylineCoords.length >= 2 && (
              <Polyline
                coordinates={polylineCoords}
                strokeColor="#74becb"
                strokeWidth={4}
              />
            )}
            {markerPoints.map((point) => {
              const isSelected = point.id === selectedPointId;
              return (
                <Marker
                  key={point.id}
                  coordinate={{
                    latitude: point.latitude,
                    longitude: point.longitude,
                  }}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={shouldTrackMarkerChanges}
                  onPress={() => handleMarkerPress(point)}
                  zIndex={isSelected ? 1000 : 1}
                >
                  <View
                    style={[
                      styles.orderMarker,
                      point.isStart && styles.orderMarkerStart,
                      point.isEnd && !point.isStart && styles.orderMarkerEnd,
                      isSelected && styles.orderMarkerSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.orderMarkerText,
                        isSelected && styles.orderMarkerTextSelected,
                      ]}
                    >
                      {point.order}
                    </Text>
                  </View>
                </Marker>
              );
            })}
          </MapView>
        )}

        {!!startPoint && !isLoading && (
          <Pressable
            style={styles.centerButton}
            onPress={handleCenterOnFirstPoint}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={centerButtonLabel}
          >
            <Ionicons name="locate-outline" size={18} color="#0f172a" />
            <Text style={styles.centerButtonText}>{centerButtonLabel}</Text>
          </Pressable>
        )}

        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {points.length}{" "}
            {points.length === 1 ? pointSingularLabel : pointPluralLabel}
          </Text>
        </View>

        {startPoint && (
          <View style={[styles.marker, styles.markerStart]}>
            <Ionicons name="radio-button-on" size={16} color="#22c55e" />
            <Text style={styles.markerText}>
              {formatPointTime(startPoint.timestamp)}
            </Text>
          </View>
        )}
        {endPoint && endPoint !== startPoint && (
          <View style={[styles.marker, styles.markerEnd]}>
            <Ionicons name="flag" size={16} color="#ef4444" />
            <Text style={styles.markerText}>
              {formatPointTime(endPoint.timestamp)}
            </Text>
          </View>
        )}

        {!isLoading && points.length === 0 && (
          <View style={styles.emptyOverlay}>
            <Ionicons name="map-outline" size={44} color="#ccc" />
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View
          style={[
            styles.loadingList,
            listMaxHeight ? { maxHeight: listMaxHeight } : styles.flexList,
          ]}
        >
          <ActivityIndicator size="small" color="#74becb" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={orderedPoints}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          style={[
            styles.listContainer,
            listMaxHeight ? { maxHeight: listMaxHeight } : styles.flexList,
          ]}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          onScrollToIndexFailed={(info) => {
            listRef.current?.scrollToOffset({
              offset: info.averageItemLength * info.index,
              animated: true,
            });
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={48} color="#ccc" />
              <Text style={styles.emptyListText}>{emptyText}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 8,
  },
  mapContainer: {
    flex: 1,
    margin: 12,
    borderRadius: 14,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  centerButton: {
    position: "absolute",
    top: 10,
    left: 10,
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.96)",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  centerButtonText: {
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  marker: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  markerStart: { bottom: 14, left: 10 },
  markerEnd: { bottom: 14, right: 10 },
  markerText: { fontSize: 12, fontWeight: "600", color: "#0f172a" },
  orderMarker: {
    minWidth: 26,
    height: 26,
    paddingHorizontal: 6,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
    borderWidth: 2,
    borderColor: "#fff",
  },
  orderMarkerStart: {
    backgroundColor: "#22c55e",
  },
  orderMarkerEnd: {
    backgroundColor: "#ef4444",
  },
  orderMarkerSelected: {
    backgroundColor: "#f59e0b",
  },
  orderMarkerText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  orderMarkerTextSelected: {
    color: "#0f172a",
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#f5f7fa",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyText: { fontSize: 14, color: "#94a3b8" },
  listContainer: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: "#fff",
  },
  flexList: {
    flex: 1,
  },
  loadingList: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: "#fff",
    minHeight: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
    gap: 12,
  },
  emptyListText: {
    fontSize: 15,
    color: "#999",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    gap: 12,
  },
  historyItemActive: {
    backgroundColor: "#f0f7fa",
  },
  historyIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  historyIndexText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#74becb",
  },
  historyDetails: {
    flex: 1,
  },
  historyCoords: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 2,
  },
  historyMeta: {
    fontSize: 12,
    color: "#888",
  },
  historyAddress: {
    marginTop: 4,
    fontSize: 12,
    color: "#0f172a",
  },
});
