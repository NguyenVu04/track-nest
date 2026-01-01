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
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CurrentLocationMarker from "@/components/CurrentLocationMarker";
import Fab from "@/components/Fab";
import { FollowerBottomSheet } from "@/components/FollowerBottomSheet";
import FollowerMarker from "@/components/FollowerMarker";
import MapControls from "@/components/MapControls";
import MapHeader from "@/components/MapHeader";
import { Follower } from "@/constant/types";
import { useAddressFromLocation } from "@/hooks/useAddressFromLocation";
import useDeviceLocation from "@/hooks/useDeviceLocation";
import { useFollowers } from "@/hooks/useFollowers";
import { useMapController } from "@/hooks/useMapController";
import { useMockFollowers } from "@/hooks/useMockFollowers";
import { formatRelativeTime } from "@/utils";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetModalProvider,
} from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";

export default function MapScreen() {
  const {
    mapRef,
    mapType,
    setMapType,
    regionDelta,
    centerMap,
    resetCenterFlag,
  } = useMapController();

  const [tracking, setTracking] = useState(true);

  const [sharingEnabled, setSharingEnabled] = useState(true);

  const [pendingAction, setPendingAction] = useState<
    null | "tracking" | "sharing"
  >(null);

  const [showPinModal, setShowPinModal] = useState(false);

  const handleToggleTracking = (value: boolean) => {
    if (value === false) {
      setPendingAction("tracking");
      setShowPinModal(true);
    } else {
      setTracking(true);
    }
  };

  const handleToggleSharing = (value: boolean) => {
    if (value === false) {
      setPendingAction("sharing");
      setShowPinModal(true);
    } else {
      setSharingEnabled(true);
    }
  };

  const CORRECT_PIN = "1234";

  const handlePinSubmit = (pin: string) => {
    if (pin !== CORRECT_PIN) {
      Alert.alert("PIN incorrect");
      handleCancelPin();
      return;
    }

    if (pendingAction === "tracking") {
      setTracking(false);
    }

    if (pendingAction === "sharing") {
      setSharingEnabled(false);
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
    [location, regionDelta]
  );

  const formattedAddress = useAddressFromLocation(
    location?.latitude,
    location?.longitude
  );

  const mockFollowers = useMockFollowers(
    location?.latitude,
    location?.longitude
  );

  const followers: Follower[] = []; // Replace with actual follower data

  const { selectedFollowerId, setSelectedFollowerId, selectedFollower } =
    useFollowers(mockFollowers);

  const checkBeforeCenterMap = useCallback(() => {
    if (location) {
      centerMap(location.latitude, location.longitude);
    }
  }, [location, centerMap]);

  // ref
  const followerInfoSheetRef = useRef<BottomSheetModal>(null);
  const generalInfoSheetRef = useRef<BottomSheetModal>(null);

  // callbacks
  const handleFollowerInfoModalPress = useCallback(() => {
    followerInfoSheetRef.current?.present();
  }, [followerInfoSheetRef]);

  const handleGeneralInfoModalPress = useCallback(() => {
    generalInfoSheetRef.current?.present();
  }, [generalInfoSheetRef]);

  // show passed-in followers if provided, otherwise use mock data around device
  const followersToRender =
    followers && followers.length > 0 ? followers : mockFollowers;

  useEffect(() => {
    if (tracking) {
      resetCenterFlag();
      checkBeforeCenterMap();
    }
  }, [tracking, checkBeforeCenterMap, resetCenterFlag]);

  console.log("Rendering map");

  const renderItem = useCallback(
    ({ item }: { item: Follower }) => (
      <View style={{ paddingTop: 12, paddingBottom: 12, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", textAlign: "center" }}>
          {item.name}
        </Text>
        <Image
          source={require("@/assets/images/150-0.jpeg")}
          style={[
            styles.generalInfoImages,
            {
              borderColor: item.sharingActive ? "#2b9fff" : "#ccc",
            },
          ]}
          resizeMode="cover"
        />
        <Text style={styles.generalInfoText}>
          Last Active:{" "}
          {item.sharingActive ? "now" : formatRelativeTime(item?.lastActive)}
        </Text>
      </View>
    ),
    []
  );

  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
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
    []
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <MapHeader
          tracking={tracking}
          setTracking={handleToggleTracking}
          sharingEnabled={sharingEnabled}
          setSharingEnabled={handleToggleSharing}
          onSearchPress={() => console.log("Go back")}
        />

        <Modal
          visible={showPinModal}
          onRequestClose={handleCancelPin}
          animationType="fade"
          transparent
        >
          <Pressable style={styles.overlay} onPress={handleCancelPin}>
            <Pressable style={styles.card} onPress={() => {}}>
              <Text style={styles.title}>PIN Required</Text>
              <Text style={styles.subtitle}>
                Enter PIN to turn off {pendingAction}
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
          onRegionChangeComplete={resetCenterFlag}
          onPress={(e) => {
            e.stopPropagation();
            setSelectedFollowerId(null);
          }}
        >
          {location ? (
            <CurrentLocationMarker
              latitude={location.latitude}
              longitude={location.longitude}
              disabled={!tracking}
            />
          ) : null}

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
        </MapView>

        {formattedAddress && (
          <View style={styles.addressContainer}>
            <Text style={styles.addressText}>{formattedAddress}</Text>
          </View>
        )}

        <MapControls
          onCenter={checkBeforeCenterMap}
          onZoomIn={null}
          onZoomOut={null}
          onGeneralModalPress={handleGeneralInfoModalPress}
          mapType={mapType}
          setMapType={setMapType}
        />

        <Fab
          size="large"
          icon="warning"
          style={styles.sosFab}
          onPress={() => {
            Alert.alert("SOS Alert", "You are in danger?");
          }}
        />
      </View>

      <BottomSheetModalProvider>
        <BottomSheetModal
          ref={followerInfoSheetRef}
          onChange={handleSheetChanges}
          backdropComponent={renderBackdrop}
        >
          <FollowerBottomSheet follower={selectedFollower} />
        </BottomSheetModal>

        {followersToRender && (
          <BottomSheetModal
            ref={generalInfoSheetRef}
            style={styles.generalInfoSheet}
            snapPoints={["25%"]}
            enableDynamicSizing={false}
            index={0}
            enableContentPanningGesture={false}
          >
            <BottomSheetFlatList
              data={followersToRender}
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
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
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
});
