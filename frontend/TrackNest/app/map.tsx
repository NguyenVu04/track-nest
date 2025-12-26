import Fab from "@/components/Fab";
// import { useRouter } from "expo-router";
import CurrentLocationMarker from "@/components/CurrentLocationMarker";
import MapControls from "@/components/MapControls";
import MapHeader from "@/components/MapHeader";
import useDeviceLocation from "@/hooks/useDeviceLocation";
import React, { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { MapType, PROVIDER_GOOGLE } from "react-native-maps";

export default function MapScreen() {
  const [tracking, setTracking] = useState(true);
  const [sharingEnabled, setSharingEnabled] = useState(false);

  //   const router = useRouter();
  const mapRef = useRef<any>(null);
  // Track whether we've already centered the map on the user's location
  const hasCenteredRef = useRef(false);

  // current region delta/zoom (smaller -> more zoomed in)
  const [regionDelta, setRegionDelta] = useState(0.02);

  const [mapType, setMapType] = useState<MapType>("standard");

  const { location } = useDeviceLocation(tracking);

  // Reset center flag when re-enabling tracking so we re-center once
  React.useEffect(() => {
    if (tracking) hasCenteredRef.current = false;
  }, [tracking]);

  // Center the map to the current device location (triggered by compass button)
  const centerMap = () => {
    if (!location) {
      console.warn("No location available to center map");
      return;
    }
    const lat = location.latitude;
    const lon = location.longitude;
    const delta = regionDelta;

    if (mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion(
        {
          latitude: lat,
          longitude: lon,
          latitudeDelta: delta,
          longitudeDelta: delta,
        },
        300
      );
      hasCenteredRef.current = true;
    } else if (mapRef.current?.animateCamera) {
      mapRef.current.animateCamera(
        { center: { latitude: lat, longitude: lon }, zoom: 16 },
        { duration: 300 }
      );
      hasCenteredRef.current = true;
    }
  };

  // Zoom controls (add button -> zoom in; new button -> zoom out)
  const zoomIn = () => {
    const next = Math.max(0.005, regionDelta * 0.6);
    setRegionDelta(next);
    if (!location) return;
    mapRef.current?.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: next,
        longitudeDelta: next,
      },
      250
    );
  };

  const zoomOut = () => {
    const next = Math.min(0.2, regionDelta * 1.6);
    setRegionDelta(next);
    if (!location) return;
    mapRef.current?.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: next,
        longitudeDelta: next,
      },
      250
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <MapHeader
        tracking={tracking}
        setTracking={setTracking}
        sharingEnabled={sharingEnabled}
        setSharingEnabled={setSharingEnabled}
        onSearchPress={() => console.log("Go back")}
        maptype={mapType}
      />

      {/* Map (native-only) */}
      <MapView
        showsCompass={false}
        toolbarEnabled={false}
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        mapType={mapType}
        style={[styles.map, StyleSheet.absoluteFillObject]}
        initialRegion={
          location
            ? {
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: regionDelta,
                longitudeDelta: regionDelta,
              }
            : {
                latitude: 37.7749,
                longitude: -122.4194,
                latitudeDelta: regionDelta,
                longitudeDelta: regionDelta,
              }
        }
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {location ? (
          <CurrentLocationMarker
            latitude={location.latitude}
            longitude={location.longitude}
            disabled={!tracking}
          />
        ) : null}
      </MapView>

      {/* Floating controls */}
      <MapControls
        onCenter={centerMap}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        mapType={mapType}
        setMapType={setMapType}
      />

      {/* Large center FAB */}
      <Fab
        size="large"
        icon="warning"
        style={{
          position: "absolute",
          alignSelf: "center",
          bottom: 24,
        }}
      />
    </View>
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
    // backgroundColor: "rgba(255,255,255,0.4)",
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
  map: { flex: 1 },
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
});
