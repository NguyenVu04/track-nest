import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

const TRACKING_KEY = "@TrackNest:tracking";

type TrackingContextType = {
  tracking: boolean;
  setTracking: (value: boolean) => void;
};

const TrackingContext = createContext<TrackingContextType | undefined>(
  undefined,
);

export const TrackingProvider = ({ children }: { children: ReactNode }) => {
  const [tracking, setTrackingState] = useState(false);

  // Load saved tracking preference on mount
  useEffect(() => {
    loadTracking();
  }, []);

  const loadTracking = async () => {
    try {
      const savedTracking = await AsyncStorage.getItem(TRACKING_KEY);
      if (savedTracking !== null) {
        setTrackingState(savedTracking === "true");
      }
    } catch (error) {
      console.error("Failed to load tracking preference:", error);
    }
  };

  const setTracking = async (value: boolean) => {
    try {
      await AsyncStorage.setItem(TRACKING_KEY, String(value));
      setTrackingState(value);
    } catch (error) {
      console.error("Failed to save tracking preference:", error);
    }
  };

  return (
    <TrackingContext.Provider value={{ tracking, setTracking }}>
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
