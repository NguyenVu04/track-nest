import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { NativeModules } from "react-native";
import type {
  PostEmergencyRequestResponse,
  SafeZone,
  CreateEmergencyRequestData,
} from "@/types/emergency";
import { emergencyService } from "@/services/emergency";
import * as Location from "expo-location";

const { NativeLocationModule } = NativeModules;

interface EmergencyContextType {
  /** True when the current user has a PENDING or ACCEPTED emergency request. */
  isEmergencyActive: boolean;
  /**
   * Re-evaluate whether the user has an active emergency by calling
   * GET /emergency-request-receiver/user/{userId}/emergency-request-allowed.
   * Call this whenever the map screen gains focus.
   */
  refreshActiveEmergencyStatus: (userId: string) => Promise<void>;
  createEmergencyRequest: (targetId: string) => Promise<PostEmergencyRequestResponse>;
  getNearestSafeZones: (location?: { lat: number; lng: number }) => Promise<SafeZone[]>;
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

export const useEmergency = (): EmergencyContextType => {
  const context = useContext(EmergencyContext);
  if (context === undefined) {
    throw new Error("useEmergency must be used within an EmergencyProvider");
  }
  return context;
};

interface EmergencyProviderProps {
  children: ReactNode;
}

export const EmergencyProvider: React.FC<EmergencyProviderProps> = ({ children }) => {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);

  // Sync the native location-service tracking mode whenever emergency state changes.
  // Wrapped in its own effect so we never call the native module from inside an
  // async callback where errors would be harder to isolate.
  useEffect(() => {
    try {
      if (
        NativeLocationModule &&
        typeof NativeLocationModule.forceTrackingMode === "function"
      ) {
        NativeLocationModule.forceTrackingMode(
          isEmergencyActive ? "NAVIGATION" : "NORMAL",
        );
      }
    } catch {
      // Native module may not be available in Expo Go / unit tests.
    }
  }, [isEmergencyActive]);

  /**
   * Ask the backend whether the user is allowed to create a new emergency
   * request. allowed=false  →  an active (PENDING/ACCEPTED) request exists.
   */
  const refreshActiveEmergencyStatus = useCallback(
    async (userId: string): Promise<void> => {
      if (!userId) return;
      try {
        const result = await emergencyService.checkEmergencyRequestAllowed(userId);
        setIsEmergencyActive(!result.allowed);
      } catch {
        // Silently ignore — network unavailable on boot or background is fine.
      }
    },
    [],
  );

  const createEmergencyRequest = useCallback(
    async (targetId: string): Promise<PostEmergencyRequestResponse> => {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const requestData: CreateEmergencyRequestData = {
          targetId,
          lastLatitudeDegrees: location.coords.latitude,
          lastLongitudeDegrees: location.coords.longitude,
        };

        const result = await emergencyService.createEmergencyRequest(requestData);

        // Optimistically mark emergency as active so the marker updates
        // immediately, before the next useFocusEffect refresh fires.
        setIsEmergencyActive(true);

        return result;
      } catch (error) {
        console.error("Failed to create emergency request:", error);
        throw error;
      }
    },
    [],
  );

  const getNearestSafeZones = useCallback(
    async (location?: { lat: number; lng: number }): Promise<SafeZone[]> => {
      try {
        let queryLocation = location;

        if (!queryLocation) {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          queryLocation = {
            lat: currentLocation.coords.latitude,
            lng: currentLocation.coords.longitude,
          };
        }

        return await emergencyService.getNearestSafeZones(queryLocation);
      } catch (error) {
        console.error("Failed to fetch nearest safe zones:", error);
        return [];
      }
    },
    [],
  );

  const contextValue: EmergencyContextType = {
    isEmergencyActive,
    refreshActiveEmergencyStatus,
    createEmergencyRequest,
    getNearestSafeZones,
  };

  return (
    <EmergencyContext.Provider value={contextValue}>
      {children}
    </EmergencyContext.Provider>
  );
};

export default EmergencyContext;
