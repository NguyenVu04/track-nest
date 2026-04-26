import { SHARE_LOCATION_KEY, TRACKING_KEY } from "@/constant";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type TrackingContextType = {
  tracking: boolean;
  setTracking: (value: boolean) => void;
  shareLocation: boolean;
  setShareLocation: (value: boolean) => void;
};

const TrackingContext = createContext<TrackingContextType | undefined>(
  undefined,
);

export const TrackingProvider = ({ children }: { children: ReactNode }) => {
  const [tracking, setTrackingState] = useState(true);
  const [shareLocation, setShareLocationState] = useState(false);

  // Load saved preferences on mount.
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      // Tracking is always enforced ON in the app UX.
      setTrackingState(true);
      await AsyncStorage.setItem(TRACKING_KEY, "true");

      const savedShareLocation = await AsyncStorage.getItem(SHARE_LOCATION_KEY);
      if (savedShareLocation !== null) {
        setShareLocationState(savedShareLocation === "true");
      }
    } catch (error) {
      console.error("Failed to load tracking/share preferences:", error);
    }
  };

  const setTracking = async (_value: boolean) => {
    try {
      // Keep this setter for compatibility but force tracking to true.
      await AsyncStorage.setItem(TRACKING_KEY, "true");
      setTrackingState(true);
    } catch (error) {
      console.error("Failed to save tracking preference:", error);
    }
  };

  const setShareLocation = async (value: boolean) => {
    try {
      await AsyncStorage.setItem(SHARE_LOCATION_KEY, String(value));
      setShareLocationState(value);
    } catch (error) {
      console.error("Failed to save share location preference:", error);
    }
  };

  return (
    <TrackingContext.Provider
      value={{ tracking, setTracking, shareLocation, setShareLocation }}
    >
      {children}
    </TrackingContext.Provider>
  );
};

export const useTracking = () => {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error("useTracking must be used within a TrackingProvider");
  }
  return context;
};
