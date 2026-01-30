import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { MapType } from "react-native-maps";

const MAP_TYPE_KEY = "@TrackNest:mapType";

type MapContextType = {
  mapType: MapType;
  setMapType: (value: MapType) => void;
};

const MapContext = createContext<MapContextType | undefined>(undefined);

const isValidMapType = (value: string): value is MapType => {
  return [
    "standard",
    // "satellite",
    "hybrid",
    // "terrain",
    // "none",
    // "mutedStandard",
  ].includes(value);
};

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const [mapType, setMapTypeState] = useState<MapType>("standard");

  // Load saved map type preference on mount
  useEffect(() => {
    loadMapType();
  }, []);

  const loadMapType = async () => {
    try {
      const savedMapType = await AsyncStorage.getItem(MAP_TYPE_KEY);
      if (savedMapType !== null && isValidMapType(savedMapType)) {
        setMapTypeState(savedMapType);
      }
    } catch (error) {
      console.error("Failed to load map type preference:", error);
    }
  };

  const setMapType = async (value: MapType) => {
    try {
      await AsyncStorage.setItem(MAP_TYPE_KEY, value);
      setMapTypeState(value);
    } catch (error) {
      console.error("Failed to save map type preference:", error);
    }
  };

  return (
    <MapContext.Provider value={{ mapType, setMapType }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMapContext must be used within a MapProvider");
  }
  return context;
};

// Backward compatibility aliases
export const TrackingProvider = MapProvider;
export const useTracking = useMapContext;
