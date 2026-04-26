// ====================
// Library imports
// ====================
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import MapView, {
  Circle,
  MapType,
  Marker,
  PROVIDER_GOOGLE,
} from "react-native-maps";

// ====================
// Custom imports
// ====================
import FamilyCircleListSheet from "@/components/BottomSheets/FamilyCircleListSheet";
import FollowerInfoSheet from "@/components/BottomSheets/FollowerInfoSheet";
import GeneralFollowerInfoSheet from "@/components/BottomSheets/GeneralFollowerInfoSheet";
import MapTypesSheet from "@/components/BottomSheets/MapTypesSheet";
import CurrentLocationMarker from "@/components/CurrentLocationMarker";
import { FollowerInfo } from "@/components/FollowerInfo";
import FollowerMarker from "@/components/FollowerMarker";
import { LocationLoader } from "@/components/Loaders/LocationLoader";
import { MapViewLoader } from "@/components/Loaders/MapViewLoader";
import MapControls from "@/components/MapControls";
import MapHeader from "@/components/MapHeader";
import { map as mapLang } from "@/constant/languages";
import { getMockFollowersForCircle } from "@/constant/mockFamilyCircles";
import { FamilyCircle, Follower, SafeZone } from "@/constant/types";
import { useMapContext } from "@/contexts/MapContext";
import { usePOIAnalytics } from "@/contexts/POIAnalyticsContext";
import { useTracking } from "@/contexts/TrackingContext";
import { useAddressFromLocation } from "@/hooks/useAddressFromLocation";
import useDeviceLocation from "@/hooks/useDeviceLocation";
import { useFamilyCircle } from "@/hooks/useFamilyCircle";
import { useFollowers } from "@/hooks/useFollowers";
import { useMapController } from "@/hooks/useMapController";
import { useStreamedFollowers } from "@/hooks/useStreamedFollowers";
import { useTranslation } from "@/hooks/useTranslation";
import { emergencyService } from "@/services/emergency";
import { updateUserLocation } from "@/services/tracker";
import { colors, radii, spacing } from "@/styles/styles";

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

export default function MapScreen() {
  // ====================
  // State declarations
  // ====================
  const [isMapReady, setIsMapReady] = useState(false);
  const [showCrimeHeatmap, setShowCrimeHeatmap] = useState(false);
  const [showPOIs, setShowPOIs] = useState(true);

  // Keep the tab bar visible above any BottomSheetModal opened from this screen
  const tabBarHeight = useBottomTabBarHeight();
  const sheetContainerStyle = useMemo(
    () => ({ bottom: tabBarHeight }),
    [tabBarHeight],
  );

  // ====================
  // Ref declarations
  // ====================
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const followerInfoSheetRef = useRef<BottomSheetModal>(null);
  const generalInfoSheetRef = useRef<BottomSheetModal>(null);
  const myInfoSheetRef = useRef<BottomSheetModal>(null);
  const mapTypeSheetRef = useRef<BottomSheetModal>(null);
  const familyCircleSheetRef = useRef<BottomSheetModal>(null);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);

  // ====================
  // Hook usages
  // ====================
  const { mapRef, regionDelta, centerMap, resetCenterFlag } =
    useMapController();
  const { height: screenHeight } = useWindowDimensions();
  const { mapType, setMapType } = useMapContext();
  const { tracking, shareLocation } = useTracking();
  const { crimeHeatmapPoints, loadCrimeHeatmap, nearbyPOIs, getPOIColor } =
    usePOIAnalytics();
  const { circles, selectedCircle, selectCircle, refreshCircles } =
    useFamilyCircle();
  const t = useTranslation(mapLang);
  const { location } = useDeviceLocation(tracking);
  const myAddress = useAddressFromLocation(
    location?.latitude,
    location?.longitude,
  );

  // ── Live streamed followers from the server ──
  const { followers: streamedFollowers } = useStreamedFollowers(
    selectedCircle?.familyCircleId,
    tracking,
  );

  // ── Fallback: mock followers (used when stream has no data yet) ──
  const circleFollowers: Follower[] = useMemo(() => {
    if (!selectedCircle || !location) return [];
    return getMockFollowersForCircle(
      selectedCircle.familyCircleId,
      location.latitude,
      location.longitude,
    );
  }, [selectedCircle, location]);
  const followersToRender = useMemo(() => {
    // Priority: streamed (real) > circle mock > generic mock
    const baseFollowers =
      streamedFollowers.length > 0
        ? streamedFollowers
        : circleFollowers.length > 0
          ? circleFollowers
          : [];
    return [...baseFollowers].sort((a, b) => {
      // First, sort by active status (active first)
      if (a.sharingActive !== b.sharingActive) {
        return a.sharingActive ? -1 : 1;
      }
      // Then, sort by lastActive time (most recent first)
      const timeA = a.lastActive ? new Date(a.lastActive).getTime() : 0;
      const timeB = b.lastActive ? new Date(b.lastActive).getTime() : 0;
      return timeB - timeA;
    });
  }, [streamedFollowers, circleFollowers]);

  // ── Upload user location to server when it changes ──
  const hasAnimatedInitialRef = useRef(false);
  const lastUploadedRef = useRef<{ lat: number; lng: number } | null>(null);
  const locationRef2 = useRef(location);
  useEffect(() => {
    locationRef2.current = location;
  }, [location]);

  useEffect(() => {
    if (!tracking || !shareLocation) return;

    const upload = (loc: typeof location) => {
      if (!loc) return;
      updateUserLocation([
        {
          latitudeDeg: loc.latitude,
          longitudeDeg: loc.longitude,
          accuracyMeter: loc.accuracy ?? 10,
          velocityMps: loc.speed ?? 0,
        },
      ]).catch((err) => console.warn("Location upload failed:", err.message));
    };

    // Upload on meaningful position change
    const prev = lastUploadedRef.current;
    if (
      location &&
      (!prev ||
        Math.abs(prev.lat - location.latitude) >= 0.0001 ||
        Math.abs(prev.lng - location.longitude) >= 0.0001)
    ) {
      lastUploadedRef.current = {
        lat: location.latitude,
        lng: location.longitude,
      };
      upload(location);
    }

    // Heartbeat: upload current position every 5s regardless of movement
    const heartbeat = setInterval(() => upload(locationRef2.current), 5000);
    return () => clearInterval(heartbeat);
  }, [tracking, shareLocation, location]);

  useEffect(() => {
    const mapKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!mapKey) {
      Alert.alert(t.apiKeyMissingTitle, t.apiKeyMissingMessage);
    }
  }, [t.apiKeyMissingMessage, t.apiKeyMissingTitle]);

  const { setSelectedFollowerId, selectedFollower } =
    useFollowers(followersToRender);
  const meItem: Follower | null = useMemo(() => {
    if (!location) return null;
    return {
      id: "me",
      latitude: location.latitude,
      longitude: location.longitude,
      name: t.me,
      avatar: undefined,
      lastActive: Date.now(),
      sharingActive: true,
      shareTracking: true,
    };
  }, [location, t.me]);
  const generalInfoListData = useMemo(() => {
    const list: Follower[] = [];
    if (meItem) list.push(meItem);
    list.push(...followersToRender);
    return list;
  }, [meItem, followersToRender]);
  const initialRegion = useMemo(
    () => ({
      latitude: location?.latitude || 0,
      longitude: location?.longitude || 0,
      latitudeDelta: regionDelta,
      longitudeDelta: regionDelta,
    }),
    [location, regionDelta],
  );

  const checkBeforeCenterMap = useCallback(() => {
    if (location) {
      centerMap(location.latitude, location.longitude);
    }
  }, [location, centerMap]);

  const handleFollowerInfoModalPress = useCallback(() => {
    followerInfoSheetRef.current?.present();
  }, [followerInfoSheetRef]);

  const handleGeneralInfoModalPress = useCallback(() => {
    generalInfoSheetRef.current?.present();
  }, [generalInfoSheetRef]);

  const handleMyInfoModalPress = useCallback(() => {
    myInfoSheetRef.current?.present();
  }, [myInfoSheetRef]);

  const handleMapTypeModalPress = useCallback(() => {
    mapTypeSheetRef.current?.present();
  }, [mapTypeSheetRef]);

  const handleFamilyCircleModalPress = useCallback(() => {
    familyCircleSheetRef.current?.present();
  }, [familyCircleSheetRef]);

  const handleSelectFamilyCircle = useCallback(
    (circle: FamilyCircle) => {
      selectCircle(circle);
      familyCircleSheetRef.current?.dismiss();
    },
    [selectCircle],
  );

  const handleSelectMapType = useCallback(
    (type: MapType) => {
      setMapType(type);
      mapTypeSheetRef.current?.dismiss();
    },
    [setMapType],
  );

  const handleMapReady = useCallback(() => {
    // Small delay to ensure map tiles are loaded
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsMapReady(true);
      });
    }, 500);
  }, [fadeAnim]);

  // Animate to current location once on first load
  useEffect(() => {
    if (!isMapReady || !location || hasAnimatedInitialRef.current) return;
    hasAnimatedInitialRef.current = true;
    centerMap(location.latitude, location.longitude);
  }, [isMapReady, location, centerMap]);

  // Load real safe zones when location is available
  useEffect(() => {
    if (!location) return;
    emergencyService
      .getNearestSafeZones({
        lat: location.latitude,
        lng: location.longitude,
        maxDistance: 10000,
        maxNumber: 20,
      })
      .then(setSafeZones)
      .catch((err) => console.warn("Failed to load safe zones:", err.message));
  }, [location?.latitude, location?.longitude]);

  // Load crime heatmap when toggled on
  useEffect(() => {
    if (showCrimeHeatmap && location) {
      loadCrimeHeatmap(location.latitude, location.longitude);
    }
  }, [showCrimeHeatmap, location, loadCrimeHeatmap]);

  const generalInfoRenderItem = useCallback(
    ({ item }: { item: Follower }) => (
      <Pressable
        onPress={() => {
          if (item.id === "me") {
            handleMyInfoModalPress();
          } else {
            setSelectedFollowerId(item.id);
            handleFollowerInfoModalPress();
          }
          centerMap(item.latitude, item.longitude);
        }}
      >
        <FollowerInfo
          follower={item}
          width={100}
          height={100}
          standMode="compact"
        />
      </Pressable>
    ),
    [
      setSelectedFollowerId,
      handleFollowerInfoModalPress,
      handleMyInfoModalPress,
      centerMap,
    ],
  );

  const speedKmh =
    location?.speed != null && Number.isFinite(location.speed)
      ? Math.round(location.speed * 3.6)
      : null;
  const timeSpentAtPlace =
    typeof location?.time_spent === "number" && location.time_spent >= 0
      ? formatDuration(Math.floor(location.time_spent))
      : null;
  const lastUpdatedText =
    location?.timestamp != null
      ? new Date(location.timestamp).toLocaleString()
      : null;

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.3}
        pressBehavior="close"
      />
    ),
    [],
  );

  // Show loading state until location is available
  if (!location) {
    return <LocationLoader />;
  }

  return (
    <>
      <View style={styles.container}>
        {/* Loading overlay with fade animation */}
        {!isMapReady && (
          <MapViewLoader fadeAnim={fadeAnim} isMapReady={isMapReady} />
        )}

        <MapHeader
          selectedCircle={selectedCircle}
          handleFamilyCircleModalPress={handleFamilyCircleModalPress}
        />

        <MapView
          loadingEnabled={true}
          // cacheEnabled={true}
          moveOnMarkerPress={true}
          showsCompass={false}
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          mapType={mapType}
          style={StyleSheet.absoluteFillObject}
          initialRegion={initialRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
          onMapReady={handleMapReady}
          onRegionChangeComplete={resetCenterFlag}
          onPress={(e) => {
            e.stopPropagation();
            setSelectedFollowerId(null);
          }}
        >
          {safeZones.map((zone) => (
            <Circle
              key={`safe-zone-area-${zone.id}`}
              center={{
                latitude: zone.latitude,
                longitude: zone.longitude,
              }}
              radius={zone.radius}
              strokeColor="rgba(46, 204, 113, 0.85)"
              fillColor="rgba(46, 204, 113, 0.18)"
              strokeWidth={2}
            />
          ))}

          {safeZones.map((zone) => (
            <Marker
              key={`safe-zone-marker-${zone.id}`}
              coordinate={{
                latitude: zone.latitude,
                longitude: zone.longitude,
              }}
              title={zone.name}
              description={`Safe radius: ${zone.radius}m`}
              pinColor="#2ecc71"
            />
          ))}

          {/* POI Markers */}
          {showPOIs &&
            nearbyPOIs.map((poi) => (
              <Marker
                key={`poi-${poi.id}`}
                coordinate={{
                  latitude: poi.latitude,
                  longitude: poi.longitude,
                }}
                title={poi.name}
                description={poi.description || poi.category}
                pinColor={getPOIColor(poi.category)}
              />
            ))}

          {/* Crime Heatmap Circles */}
          {showCrimeHeatmap &&
            crimeHeatmapPoints.map((crime) => (
              <Circle
                key={`crime-${crime.id}`}
                center={{
                  latitude: crime.latitude,
                  longitude: crime.longitude,
                }}
                radius={100 + crime.severity * 30}
                strokeColor={
                  crime.severity >= 4
                    ? "#e74c3c"
                    : crime.severity >= 2
                      ? "#f39c12"
                      : "#27ae60"
                }
                fillColor={
                  crime.severity >= 4
                    ? "rgba(231, 76, 60, 0.3)"
                    : crime.severity >= 2
                      ? "rgba(243, 156, 18, 0.2)"
                      : "rgba(39, 174, 96, 0.15)"
                }
                strokeWidth={2}
              />
            ))}

          {followersToRender && followersToRender.length > 0
            ? followersToRender.map((f) => (
                <FollowerMarker
                  key={f.id ?? `${f.latitude}-${f.longitude}`}
                  id={f.id}
                  latitude={f.latitude}
                  longitude={f.longitude}
                  avatar={f.avatar}
                  name={f.name}
                  sharingActive={f.sharingActive ?? f.shareTracking}
                  lastActive={f.lastActive}
                  setSelectedFollowerId={setSelectedFollowerId}
                  handlePresentModalPress={handleFollowerInfoModalPress}
                />
              ))
            : null}

          {location ? (
            <CurrentLocationMarker
              latitude={location.latitude}
              longitude={location.longitude}
              speed={location.speed}
              disabled={!tracking}
            />
          ) : null}
        </MapView>

        <MapControls
          onCenter={checkBeforeCenterMap}
          onZoomIn={null}
          onZoomOut={null}
          onGeneralModalPress={handleGeneralInfoModalPress}
          onMapTypePress={handleMapTypeModalPress}
          onToggleHeatmap={() => setShowCrimeHeatmap(!showCrimeHeatmap)}
          onTogglePOIs={() => setShowPOIs(!showPOIs)}
          mapType={mapType}
          showHeatmap={showCrimeHeatmap}
          showPOIs={showPOIs}
        />
      </View>

      <FollowerInfoSheet
        followerInfoSheetRef={followerInfoSheetRef}
        renderBackdrop={renderBackdrop}
        selectedFollower={selectedFollower}
        tabBarHeight={tabBarHeight}
      />

      {generalInfoListData.length > 0 && (
        <GeneralFollowerInfoSheet
          generalInfoSheetRef={generalInfoSheetRef}
          generalInfoListData={generalInfoListData}
          generalInfoRenderItem={generalInfoRenderItem}
          tabBarHeight={tabBarHeight}
        />
      )}

      <BottomSheetModal
        ref={myInfoSheetRef}
        backdropComponent={renderBackdrop}
        enableDynamicSizing={true}
        maxDynamicContentSize={Math.floor(screenHeight * 0.55)}
        index={0}
        containerStyle={sheetContainerStyle}
      >
        <View style={styles.myInfoContent}>
          <Text style={styles.myInfoTitle}>{t.me}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{t.me}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full address</Text>
            <Text style={styles.infoValue}>
              {myAddress ?? "Resolving address..."}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Speed</Text>
            <Text style={styles.infoValue}>
              {speedKmh != null ? `${speedKmh} km/h` : "N/A"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Time spent here</Text>
            <Text style={styles.infoValue}>{timeSpentAtPlace ?? "N/A"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Coordinates</Text>
            <Text style={styles.infoValue}>
              {`${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last updated</Text>
            <Text style={styles.infoValue}>{lastUpdatedText ?? "N/A"}</Text>
          </View>
        </View>
      </BottomSheetModal>

      <MapTypesSheet
        mapTypeSheetRef={mapTypeSheetRef}
        renderBackdrop={renderBackdrop}
        mapType={mapType}
        handleSelectMapType={handleSelectMapType}
        tabBarHeight={tabBarHeight}
      />

      <FamilyCircleListSheet
        familyCircleSheetRef={familyCircleSheetRef}
        renderBackdrop={renderBackdrop}
        selectedCircle={selectedCircle}
        handleSelectFamilyCircle={handleSelectFamilyCircle}
        familyCircles={circles}
        onRefresh={refreshCircles}
        tabBarHeight={tabBarHeight}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", position: "relative" },
  myInfoContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  myInfoTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  infoRow: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "500",
  },
});
