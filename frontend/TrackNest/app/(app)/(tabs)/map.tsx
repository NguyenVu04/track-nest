// ====================
// Library imports
// ====================
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  DeviceEventEmitter,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import MapView, {
  Circle,
  MapType,
  Marker,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import {
  TourGuideProvider,
  TourGuideZoneByPosition,
  useTourGuideController,
} from "rn-tourguide";

// ====================
// Custom imports
// ====================
import FamilyCircleListSheet from "@/components/BottomSheets/FamilyCircleListSheet";
import FollowerInfoSheet from "@/components/BottomSheets/FollowerInfoSheet";
import GeneralFollowerInfoSheet from "@/components/BottomSheets/GeneralFollowerInfoSheet";
import MapTypesSheet from "@/components/BottomSheets/MapTypesSheet";
import MyInfoSheet from "@/components/BottomSheets/MyInfoSheet";
import CurrentLocationMarker from "@/components/CurrentLocationMarker";
import { FollowerInfo } from "@/components/FollowerInfo";
import FollowerMarker from "@/components/FollowerMarker";
import { LocationLoader } from "@/components/Loaders/LocationLoader";
import { MapViewLoader } from "@/components/Loaders/MapViewLoader";
import MapControls from "@/components/MapControls";
import MapHeader from "@/components/MapHeader";
import { OPEN_GENERAL_INFO_SHEET_EVENT } from "@/constant";
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
import {
  hasCompletedMapWalkthrough,
  markMapWalkthroughCompleted,
} from "@/utils/walkthrough";
import { showToast } from "@/utils";

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

function isLongitudeVisible(lng: number, minLng: number, maxLng: number) {
  if (minLng <= maxLng) {
    return lng >= minLng && lng <= maxLng;
  }

  // Region crosses the antimeridian.
  return lng >= minLng || lng <= maxLng;
}

function isCoordinateVisibleInRegion(
  latitude: number,
  longitude: number,
  region: Region,
) {
  const halfLat = region.latitudeDelta / 2;
  const halfLng = region.longitudeDelta / 2;

  const minLat = region.latitude - halfLat;
  const maxLat = region.latitude + halfLat;
  const minLng = region.longitude - halfLng;
  const maxLng = region.longitude + halfLng;

  const inLatitudeRange = latitude >= minLat && latitude <= maxLat;
  const inLongitudeRange = isLongitudeVisible(longitude, minLng, maxLng);

  return inLatitudeRange && inLongitudeRange;
}

export default function MapScreen() {
  const t = useTranslation(mapLang);

  return (
    <TourGuideProvider
      androidStatusBarVisible
      backdropColor="rgba(15,23,42,0.65)"
      labels={{
        previous: t.tourPrevious,
        next: t.tourNext,
        skip: t.tourSkip,
        finish: t.tourFinish,
      }}
    >
      <MapScreenContent />
    </TourGuideProvider>
  );
}

function MapScreenContent() {
  // ====================
  // State declarations
  // ====================
  const [isMapReady, setIsMapReady] = useState(false);
  const [showCrimeHeatmap, setShowCrimeHeatmap] = useState(false);
  const [showPOIs, setShowPOIs] = useState(true);
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [shouldStartMapTour, setShouldStartMapTour] = useState(false);
  const [visibleRegion, setVisibleRegion] = useState<Region | null>(null);

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
  const hasTriggeredMapTourRef = useRef(false);
  const startTourRef = useRef<(() => void) | null>(null);
  const followerInfoSheetRef = useRef<BottomSheetModal>(null);
  const generalInfoSheetRef = useRef<BottomSheetModal>(null);
  const myInfoSheetRef = useRef<BottomSheetModal>(null);
  const mapTypeSheetRef = useRef<BottomSheetModal>(null);
  const familyCircleSheetRef = useRef<BottomSheetModal>(null);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const router = useRouter();

  // ====================
  // Hook usages
  // ====================
  const { canStart, start, eventEmitter } = useTourGuideController();
  const { mapRef, regionDelta, centerMap, resetCenterFlag } =
    useMapController();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const { mapType, setMapType } = useMapContext();
  const { tracking, shareLocation } = useTracking();
  const { crimeHeatmapPoints, loadCrimeHeatmap, nearbyPOIs, getPOIColor } =
    usePOIAnalytics();
  const { circles, selectedCircle, selectCircle, refreshCircles } =
    useFamilyCircle();
  const t = useTranslation(mapLang);
  const { location } = useDeviceLocation(tracking);
  const hasLocation = !!location;
  const myAddress = useAddressFromLocation(
    location?.latitude,
    location?.longitude,
  );

  useEffect(() => {
    startTourRef.current = start;
  }, [start]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        followerInfoSheetRef.current?.dismiss();
        generalInfoSheetRef.current?.dismiss();
        myInfoSheetRef.current?.dismiss();
        mapTypeSheetRef.current?.dismiss();
        familyCircleSheetRef.current?.dismiss();
      };
    }, [])
  );

  useEffect(() => {
    let isMounted = true;

    hasCompletedMapWalkthrough().then((completed) => {
      if (!isMounted) return;
      setShouldStartMapTour(!completed);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const onTourStop = () => {
      setShouldStartMapTour(false);
    };

    eventEmitter?.on("stop", onTourStop);
    return () => {
      eventEmitter?.off("stop", onTourStop);
    };
  }, [eventEmitter]);

  useEffect(() => {
    if (!shouldStartMapTour || !canStart || !isMapReady || !hasLocation) {
      return;
    }

    if (hasTriggeredMapTourRef.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      hasTriggeredMapTourRef.current = true;
      markMapWalkthroughCompleted()
        .catch(() => {
          // non-critical persistence failure
        })
        .finally(() => {
          startTourRef.current?.();
        });
    }, 700);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [canStart, hasLocation, isMapReady, shouldStartMapTour]);

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
      showToast(t.apiKeyMissingMessage, t.apiKeyMissingTitle);
    }
  }, [t.apiKeyMissingMessage, t.apiKeyMissingTitle]);

  const { setSelectedFollowerId, selectedFollower } =
    useFollowers(followersToRender);

  // Resolve address for the selected follower to show in the floating card
  const selectedFollowerAddress = useAddressFromLocation(
    selectedFollower?.latitude,
    selectedFollower?.longitude,
  );

  // Speed in km/h for the selected follower (if available from stream data)
  const selectedFollowerSpeedKmh = useMemo(() => {
    if (!selectedFollower) return null;
    const speed = (selectedFollower as any).speed as number | undefined;
    if (speed != null && Number.isFinite(speed)) return Math.round(speed * 3.6);
    return null;
  }, [selectedFollower]);

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

  const isCurrentMarkerVisible = useMemo(() => {
    if (!location) return false;
    if (!visibleRegion) return true;

    return isCoordinateVisibleInRegion(
      location.latitude,
      location.longitude,
      visibleRegion,
    );
  }, [location, visibleRegion]);

  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      setVisibleRegion(region);
      resetCenterFlag();
    },
    [resetCenterFlag],
  );

  const handleFollowerInfoModalPress = useCallback(() => {
    followerInfoSheetRef.current?.present();
  }, [followerInfoSheetRef]);

  const handleGeneralInfoModalPress = useCallback(() => {
    generalInfoSheetRef.current?.present();
  }, [generalInfoSheetRef]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      OPEN_GENERAL_INFO_SHEET_EVENT,
      () => {
        handleGeneralInfoModalPress();
      },
    );

    return () => {
      subscription.remove();
    };
  }, [handleGeneralInfoModalPress]);

  const handleMyInfoModalPress = useCallback(() => {
    myInfoSheetRef.current?.present();
  }, [myInfoSheetRef]);

  const handleMapTypeModalPress = useCallback(() => {
    mapTypeSheetRef.current?.present();
  }, [mapTypeSheetRef]);

  const handleFamilyCircleModalPress = useCallback(() => {
    familyCircleSheetRef.current?.present();
  }, [familyCircleSheetRef]);

  const handleAddFamilyCircle = useCallback(() => {
    familyCircleSheetRef.current?.dismiss();
    // Let sheet dismissal animation complete before navigating.
    setTimeout(() => {
      router.push("/family-circles/new");
    }, 200);
  }, [router]);

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
  }, [location]);

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
            /* console.log("My info pressed") */;
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
        style={[props.style, { bottom: tabBarHeight }]}
      />
    ),
    [tabBarHeight],
  );

  // Show loading state until location is available
  if (!location) {
    return <LocationLoader />;
  }

  return (
    <>
      <View style={[styles.container]}>
        {/* Loading overlay with fade animation */}
        {!isMapReady && (
          <MapViewLoader fadeAnim={fadeAnim} isMapReady={isMapReady} />
        )}

        <TourGuideZoneByPosition
          zone={1}
          isTourGuide={shouldStartMapTour}
          shape="rectangle"
          top={Math.max(96, screenHeight * 0.14)}
          left={12}
          width={screenWidth - 24}
          height={Math.max(220, screenHeight * 0.36)}
          text={t.tourMapStep}
        />

        <TourGuideZoneByPosition
          zone={2}
          isTourGuide={shouldStartMapTour}
          shape="rectangle"
          top={32}
          left={10}
          width={screenWidth - 20}
          height={56}
          text={t.tourHeaderStep}
        />

        <TourGuideZoneByPosition
          zone={3}
          isTourGuide={shouldStartMapTour}
          shape="rectangle"
          right={6}
          bottom={tabBarHeight + 72}
          width={84}
          height={260}
          text={t.tourControlsStep}
        />

        <View
          style={{
            position: "absolute",
            top: 12,
            left: 0,
            right: 0,
            zIndex: 9999,
            gap: 12,
          }}
        >
          <MapHeader
            selectedCircle={selectedCircle}
            handleFamilyCircleModalPress={handleFamilyCircleModalPress}
          />
        </View>

        <MapView
          loadingEnabled={true}
          // cacheEnabled={true}
          moveOnMarkerPress={true}
          showsCompass={false}
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          mapType={mapType || "standard"}
          style={[StyleSheet.absoluteFillObject]}
          initialRegion={initialRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
          onMapReady={handleMapReady}
          onRegionChangeComplete={handleRegionChangeComplete}
          onPress={(e) => {
            e.stopPropagation?.();
            setSelectedFollowerId(null);
          }}
        >
          {showSafeZones && safeZones.map((zone) => (
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

          {showSafeZones && safeZones.map((zone) => (
            <Marker
              key={`safe-zone-marker-${zone.id}`}
              coordinate={{
                latitude: zone.latitude,
                longitude: zone.longitude,
              }}
              title={zone.name}
              description={t.safeRadiusWithMeters.replace(
                "{meters}",
                String(zone.radius),
              )}
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
              handlePress={handleMyInfoModalPress}
            />
          ) : null}
        </MapView>

        <MapControls
          onCenter={checkBeforeCenterMap}
          centerActive={isCurrentMarkerVisible}
          onZoomIn={null}
          onZoomOut={null}
          onMapTypePress={handleMapTypeModalPress}
          onToggleHeatmap={() => setShowCrimeHeatmap(!showCrimeHeatmap)}
          onTogglePOIs={() => setShowPOIs(!showPOIs)}
          onToggleSafeZones={() => setShowSafeZones(!showSafeZones)}
          mapType={mapType}
          showHeatmap={showCrimeHeatmap}
          showPOIs={showPOIs}
          showSafeZones={showSafeZones}
        />
      </View>
      <FollowerInfoSheet
        followerInfoSheetRef={followerInfoSheetRef}
        renderBackdrop={renderBackdrop}
        selectedFollower={selectedFollower}
        tabBarHeight={tabBarHeight}
        speedKmh={selectedFollowerSpeedKmh}
        address={selectedFollowerAddress}
        onChatPress={() => router.push("/(app)/family-chat" as any)}
        onCallPress={() => {}}
        onSosPress={() => router.push("/(app)/sos" as any)}
      />

      {generalInfoListData.length > 0 && (
        <GeneralFollowerInfoSheet
          generalInfoSheetRef={generalInfoSheetRef}
          generalInfoListData={generalInfoListData}
          generalInfoRenderItem={generalInfoRenderItem}
          tabBarHeight={tabBarHeight}
        />
      )}

      <MyInfoSheet
        myInfoSheetRef={myInfoSheetRef}
        renderBackdrop={renderBackdrop}
        tabBarHeight={tabBarHeight}
        containerStyle={sheetContainerStyle}
        maxDynamicContentSize={Math.floor(screenHeight * 0.55)}
        title={t.me}
        nameLabel={t.infoNameLabel}
        addressLabel={t.infoAddressLabel}
        speedLabel={t.infoSpeedLabel}
        timeSpentLabel={t.infoTimeSpentLabel}
        coordinatesLabel={t.infoCoordinatesLabel}
        lastUpdatedLabel={t.infoLastUpdatedLabel}
        resolvingAddressLabel={t.infoResolvingAddress}
        notAvailableLabel={t.notAvailable}
        myAddress={myAddress}
        speedKmh={speedKmh}
        timeSpentAtPlace={timeSpentAtPlace}
        latitude={location.latitude}
        longitude={location.longitude}
        lastUpdatedText={lastUpdatedText}
      />

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
        onAddFamilyCircle={handleAddFamilyCircle}
        tabBarHeight={tabBarHeight}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", position: "relative" },
});
