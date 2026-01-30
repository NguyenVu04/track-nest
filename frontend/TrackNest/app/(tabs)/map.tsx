import { PinInput } from "@pakenfit/react-native-pin-input";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Animated,
  Image,
} from "react-native";

import CurrentLocationMarker from "@/components/CurrentLocationMarker";
import { FamilyCircleBottomSheet } from "@/components/FamilyCircleBottomSheet";
import { FollowerBottomSheet } from "@/components/FollowerBottomSheet";
import { FollowerInfo } from "@/components/FollowerInfo";
import FollowerMarker from "@/components/FollowerMarker";
import MapControls from "@/components/MapControls";
import MapHeader from "@/components/MapHeader";
import { MapTypeBottomSheet } from "@/components/MapTypeBottomSheet";
import SosFab from "@/components/SosFab";
import { map as mapLang } from "@/constant/languages";
import {
  getMockFollowersForCircle,
  mockFamilyCircles,
} from "@/constant/mockFamilyCircles";
import { FamilyCircle, Follower } from "@/constant/types";
import { useTracking } from "@/contexts/TrackingContext";
import useDeviceLocation from "@/hooks/useDeviceLocation";
import { useFollowers } from "@/hooks/useFollowers";
import { useFamilyCircle } from "@/hooks/useFamilyCircle";
import { useMapController } from "@/hooks/useMapController";
import { useMockFollowers } from "@/hooks/useMockFollowers";
import { useTranslation } from "@/hooks/useTranslation";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetModalProvider,
} from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { useMapContext } from "@/contexts/MapContext";

export default function MapScreen() {
  const { mapRef, regionDelta, centerMap, resetCenterFlag } =
    useMapController();

  const { mapType, setMapType } = useMapContext();

  const { tracking, setTracking } = useTracking();

  const [isMapReady, setIsMapReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [pendingAction, setPendingAction] = useState<
    null | "tracking" | "sharing"
  >(null);

  const [showPinModal, setShowPinModal] = useState(false);

  // Family circle state with persistence
  const [familyCircles] = useState<FamilyCircle[]>(mockFamilyCircles);
  const {
    selectedCircle,
    selectCircle,
    isLoading: isLoadingCircle,
  } = useFamilyCircle();

  const t = useTranslation(mapLang);

  const handleToggleTracking = (value: boolean) => {
    if (value === false) {
      setPendingAction("tracking");
      setShowPinModal(true);
    } else {
      setTracking(true);
    }
  };

  const CORRECT_PIN = "1234";

  const handlePinSubmit = (pin: string) => {
    if (pin !== CORRECT_PIN) {
      Alert.alert(t.pinIncorrect);
      handleCancelPin();
      return;
    }

    if (pendingAction === "tracking") {
      setTracking(false);
    }

    setPendingAction(null);
    setShowPinModal(false);
  };

  const handleCancelPin = () => {
    setPendingAction(null);
    setShowPinModal(false);
  };

  const { location } = useDeviceLocation(tracking);

  const initialRegion = useMemo(
    () => ({
      latitude: location?.latitude || 0,
      longitude: location?.longitude || 0,
      latitudeDelta: regionDelta,
      longitudeDelta: regionDelta,
    }),
    [location, regionDelta],
  );

  const mockFollowers = useMockFollowers(
    location?.latitude,
    location?.longitude,
  );

  // Get mock followers for the selected family circle
  const circleFollowers: Follower[] = useMemo(() => {
    if (!selectedCircle || !location) return [];
    return getMockFollowersForCircle(
      selectedCircle.familyCircleId,
      location.latitude,
      location.longitude,
    );
  }, [selectedCircle, location]);

  const followersToRender = useMemo(() => {
    // Priority: circle followers > mock followers
    const baseFollowers =
      circleFollowers && circleFollowers.length > 0
        ? circleFollowers
        : mockFollowers;

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
  }, [circleFollowers, mockFollowers]);

  const { selectedFollowerId, setSelectedFollowerId, selectedFollower } =
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

  const checkBeforeCenterMap = useCallback(() => {
    if (location) {
      centerMap(location.latitude, location.longitude);
    }
  }, [location, centerMap]);

  // ref
  const followerInfoSheetRef = useRef<BottomSheetModal>(null);
  const generalInfoSheetRef = useRef<BottomSheetModal>(null);
  const mapTypeSheetRef = useRef<BottomSheetModal>(null);
  const familyCircleSheetRef = useRef<BottomSheetModal>(null);

  // callbacks
  const handleFollowerInfoModalPress = useCallback(() => {
    followerInfoSheetRef.current?.present();
  }, [followerInfoSheetRef]);

  const handleGeneralInfoModalPress = useCallback(() => {
    generalInfoSheetRef.current?.present();
  }, [generalInfoSheetRef]);

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
    (type: any) => {
      setMapType(type);
      mapTypeSheetRef.current?.dismiss();
    },
    [setMapType],
  );

  // show passed-in followers if provided, otherwise use mock data around device
  useEffect(() => {
    if (tracking) {
      resetCenterFlag();
      checkBeforeCenterMap();
    }
  }, [tracking, checkBeforeCenterMap, resetCenterFlag]);

  // Handle map ready state with fade animation
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

  const renderItem = useCallback(
    ({ item }: { item: Follower }) => (
      <Pressable
        onPress={() => {
          setSelectedFollowerId(item.id);

          handleFollowerInfoModalPress();

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
    [setSelectedFollowerId, handleFollowerInfoModalPress, centerMap],
  );

  const handleSheetChanges = useCallback((index: number) => {
    // Do nothing for now
  }, []);

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
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.loadingLogoCircle}>
            <Image
              source={require("@/assets/images/android-icon-foreground.png")}
              style={styles.loadingLogo}
            />
          </View>
          <Text style={styles.loadingTitle}>TrackNest</Text>
          <ActivityIndicator
            size="large"
            color="#74becb"
            style={styles.loadingSpinner}
          />
          <Text style={styles.loadingText}>{t.gettingLocation}</Text>
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Loading overlay with fade animation */}
        {!isMapReady && (
          <Animated.View
            style={[styles.loadingOverlay, { opacity: fadeAnim }]}
            pointerEvents={isMapReady ? "none" : "auto"}
          >
            <View style={styles.loadingContent}>
              <View style={styles.loadingLogoCircle}>
                <Image
                  source={require("@/assets/images/android-icon-foreground.png")}
                  style={styles.loadingLogo}
                />
              </View>
              <Text style={styles.loadingTitle}>TrackNest</Text>
              <ActivityIndicator
                size="large"
                color="#74becb"
                style={styles.loadingSpinner}
              />
              <Text style={styles.loadingText}>{t.loadingMap}</Text>
            </View>
          </Animated.View>
        )}

        <MapHeader
          tracking={tracking}
          setTracking={handleToggleTracking}
          onSearchPress={() => console.log("Go back")}
          selectedCircle={selectedCircle}
          handleFamilyCircleModalPress={handleFamilyCircleModalPress}
        />

        <Modal
          visible={showPinModal}
          onRequestClose={handleCancelPin}
          animationType="fade"
          transparent
        >
          <Pressable style={styles.overlay} onPress={handleCancelPin}>
            <Pressable style={styles.card} onPress={() => {}}>
              <Text style={styles.title}>{t.pinTitle}</Text>
              <Text style={styles.subtitle}>
                {t.pinSubTitle} {pendingAction}
              </Text>

              <PinInput length={4} autoFocus onFillEnded={handlePinSubmit} />
            </Pressable>
          </Pressable>
        </Modal>

        <MapView
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
          {location && followersToRender && followersToRender.length > 0
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
                  selectedFollowerId={selectedFollowerId}
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
          mapType={mapType}
        />

        <SosFab style={styles.sosFab} />
      </View>

      <BottomSheetModalProvider>
        <BottomSheetModal
          ref={followerInfoSheetRef}
          onChange={handleSheetChanges}
          backdropComponent={renderBackdrop}
        >
          <FollowerBottomSheet follower={selectedFollower} />
        </BottomSheetModal>

        {generalInfoListData.length > 0 && (
          <BottomSheetModal
            ref={generalInfoSheetRef}
            style={styles.generalInfoSheet}
            snapPoints={["25%"]}
            enableDynamicSizing={false}
            index={0}
            enableContentPanningGesture={false}
          >
            <BottomSheetFlatList
              data={generalInfoListData}
              horizontal
              snapToInterval={100}
              keyExtractor={(_: any, index: any) => index}
              decelerationRate="normal"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 24 }}
              renderItem={renderItem}
            />
          </BottomSheetModal>
        )}

        <BottomSheetModal
          ref={mapTypeSheetRef}
          onChange={handleSheetChanges}
          backdropComponent={renderBackdrop}
          enableDynamicSizing={true}
        >
          <MapTypeBottomSheet
            currentMapType={mapType}
            onSelectMapType={handleSelectMapType}
          />
        </BottomSheetModal>

        <BottomSheetModal
          ref={familyCircleSheetRef}
          onChange={handleSheetChanges}
          backdropComponent={renderBackdrop}
          enableDynamicSizing={true}
        >
          <FamilyCircleBottomSheet
            familyCircles={familyCircles}
            selectedCircleId={selectedCircle?.familyCircleId ?? null}
            onSelectCircle={handleSelectFamilyCircle}
          />
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  familyCircleSelectorContainer: {
    position: "absolute",
    top: 150,
    left: 12,
    zIndex: 10,
  },
  header: {
    position: "absolute",
    top: 36,
    left: 12,
    right: 12,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 12,
  },
  trackLabel: { marginRight: 0, color: "#ccc" },
  mapFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fabColumn: { position: "absolute", right: 12, bottom: 50, gap: 12 },
  smallFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bigFab: {
    position: "absolute",
    alignSelf: "center",
    bottom: 24,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#ff3b30",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginVertical: 8,
  },
  generalInfoImages: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
  },
  generalInfoText: { fontSize: 14, textAlign: "center" },
  addressContainer: { position: "absolute", left: 0, right: 0, bottom: 4 },
  addressText: { color: "#fff", textAlign: "center" },
  sosFab: {
    position: "absolute",
    alignSelf: "center",
    bottom: 24,
  },
  generalInfoSheet: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  overlay: {
    position: "relative",
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",

    // shadow iOS
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },

    // shadow Android
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  pinContainer: {
    marginVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  loadingContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingLogoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  loadingLogo: {
    width: 132,
    height: 132,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 24,
  },
  loadingSpinner: {
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#64748b",
  },
});
