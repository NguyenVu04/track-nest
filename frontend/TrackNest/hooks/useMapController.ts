import { useCallback, useRef, useState } from "react";
import MapView from "react-native-maps";

export function useMapController() {
  const mapRef = useRef<MapView>(null);
  const hasCenteredRef = useRef(false);

  const [regionDelta, setRegionDelta] = useState(0.02);

  const centerMap = useCallback(
    (lat: number, lng: number) => {
      if (hasCenteredRef.current) return;

      mapRef.current?.animateToRegion(
        {
          latitude: lat,
          longitude: lng,
          latitudeDelta: regionDelta,
          longitudeDelta: regionDelta,
        },
        500,
      );

      hasCenteredRef.current = true;
    },
    [regionDelta, mapRef, hasCenteredRef],
  );

  const zoom = (factor: number) => {
    const next = Math.min(0.2, Math.max(0.005, regionDelta * factor));
    setRegionDelta(next);
  };

  return {
    mapRef,
    regionDelta,
    setRegionDelta,
    centerMap,
    zoomIn: () => zoom(0.6),
    zoomOut: () => zoom(1.6),
    resetCenterFlag: () => (hasCenteredRef.current = false),
  };
}
