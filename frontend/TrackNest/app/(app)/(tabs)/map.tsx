// ====================
// Library imports
// ====================
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Alert, Animated, Pressable, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";

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
import { PinModal } from "@/components/Modals/PinModal";
import SosFab from "@/components/SosFab";
import { CORRECT_PIN } from "@/constant";
import { map as mapLang } from "@/constant/languages";
import { getMockFollowersForCircle } from "@/constant/mockFamilyCircles";
import { FamilyCircle, Follower } from "@/constant/types";
import { useMapContext } from "@/contexts/MapContext";
import { useTracking } from "@/contexts/TrackingContext";
import useDeviceLocation from "@/hooks/useDeviceLocation";
import { useFamilyCircle } from "@/hooks/useFamilyCircle";
import { useFollowers } from "@/hooks/useFollowers";
import { useMapController } from "@/hooks/useMapController";
import { useMockFollowers } from "@/hooks/useMockFollowers";
import { useTranslation } from "@/hooks/useTranslation";

export default function MapScreen() {
  // ====================
  // State declarations
  // ====================
  const [isMapReady, setIsMapReady] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    null | "tracking" | "sharing"
  >(null);
  const [showPinModal, setShowPinModal] = useState(false);

  // ====================
  // Ref declarations
  // ====================
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const followerInfoSheetRef = useRef<BottomSheetModal>(null);
  const generalInfoSheetRef = useRef<BottomSheetModal>(null);
  const mapTypeSheetRef = useRef<BottomSheetModal>(null);
  const familyCircleSheetRef = useRef<BottomSheetModal>(null);

  // ====================
  // Hook usages
  // ====================
  const { mapRef, regionDelta, centerMap, resetCenterFlag } =
    useMapController();
  const { mapType, setMapType } = useMapContext();
  const { tracking, setTracking } = useTracking();
  const { selectedCircle, selectCircle } = useFamilyCircle();
  const router = useRouter();
  const t = useTranslation(mapLang);
  const { location } = useDeviceLocation(tracking);
  const mockFollowers = useMockFollowers(
    location?.latitude,
    location?.longitude,
  );
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
  const initialRegion = useMemo(
    () => ({
      latitude: location?.latitude || 0,
      longitude: location?.longitude || 0,
      latitudeDelta: regionDelta,
      longitudeDelta: regionDelta,
    }),
    [location, regionDelta],
  );

  // ====================
  // Function declarations
  // ====================
  const handleToggleTracking = (value: boolean) => {
    if (value === false) {
      setPendingAction("tracking");
      setShowPinModal(true);
    } else {
      setTracking(true);
    }
  };

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

  const handleAddFamilyCircle = () => {
    router.push("/family-circles/new");
    familyCircleSheetRef.current?.dismiss();
  };

  const handleSelectMapType = useCallback(
    (type: any) => {
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

  const generalInfoRenderItem = useCallback(
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Loading overlay with fade animation */}
        {!isMapReady && (
          <MapViewLoader fadeAnim={fadeAnim} isMapReady={isMapReady} />
        )}

        <MapHeader
          tracking={tracking}
          setTracking={handleToggleTracking}
          onSearchPress={() => console.log("Go back")}
          selectedCircle={selectedCircle}
          handleFamilyCircleModalPress={handleFamilyCircleModalPress}
        />

        <PinModal
          showPinModal={showPinModal}
          handleCancelPin={handleCancelPin}
          pendingAction={pendingAction ?? ""}
          handlePinSubmit={handlePinSubmit}
        />

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
        <FollowerInfoSheet
          followerInfoSheetRef={followerInfoSheetRef}
          renderBackdrop={renderBackdrop}
          selectedFollower={selectedFollower}
        />

        {generalInfoListData.length > 0 && (
          <GeneralFollowerInfoSheet
            generalInfoSheetRef={generalInfoSheetRef}
            generalInfoListData={generalInfoListData}
            generalInfoRenderItem={generalInfoRenderItem}
          />
        )}

        <MapTypesSheet
          mapTypeSheetRef={mapTypeSheetRef}
          renderBackdrop={renderBackdrop}
          mapType={mapType}
          handleSelectMapType={handleSelectMapType}
        />

        <FamilyCircleListSheet
          familyCircleSheetRef={familyCircleSheetRef}
          renderBackdrop={renderBackdrop}
          selectedCircle={selectedCircle}
          handleSelectFamilyCircle={handleSelectFamilyCircle}
          handleAddFamilyCircle={handleAddFamilyCircle}
        />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  sosFab: {
    position: "absolute",
    alignSelf: "center",
    bottom: 24,
  },
});
