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
  EmergencyRequest,
  PostEmergencyRequestResponse,
  SafeZone,
  CreateEmergencyRequestData,
} from "@/types/emergency";
import { emergencyService } from "@/services/emergency";
import * as Location from "expo-location";

const { NativeLocationModule } = NativeModules;

interface EmergencyContextType {
  activeEmergency: EmergencyRequest | null;
  /** Set the active emergency and switch native location to NAVIGATION (5 s) mode. */
  setActiveEmergency: (req: EmergencyRequest | null) => void;
  /** Fetch the most recent PENDING or ACCEPTED emergency from the backend. */
  fetchActiveEmergency: () => Promise<void>;
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
  const [activeEmergency, _setActiveEmergency] = useState<EmergencyRequest | null>(null);

  // Wrap the setter so it also tells the native location service to switch
  // to NAVIGATION mode (5-second updates) for the duration of the emergency.
  const setActiveEmergency = useCallback((req: EmergencyRequest | null) => {
    _setActiveEmergency(req);
    try {
      NativeLocationModule?.forceTrackingMode(req ? "NAVIGATION" : "NORMAL");
    } catch {
      // Native module may not be available in Expo Go / unit tests.
    }
  }, []);

  // Restore active emergency from the backend after an app restart.
  const fetchActiveEmergency = useCallback(async () => {
    try {
      const page = await emergencyService.getMyEmergencyRequests(0, 10);
      const active =
        page.items.find(
          (r) => r.statusName === "PENDING" || r.statusName === "ACCEPTED",
        ) ?? null;
      setActiveEmergency(active);
    } catch {
      // Silently ignore — no network at boot is fine, we just start with null.
    }
  }, [setActiveEmergency]);

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

        // Mark this request as active so the map marker updates immediately.
        setActiveEmergency({
          id: result.id,
          openAt: new Date().toISOString(),
          senderId: targetId,
          targetId,
          emergencyServiceId: "",
          statusName: "PENDING",
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        return result;
      } catch (error) {
        console.error("Failed to create emergency request:", error);
        throw error;
      }
    },
    [setActiveEmergency],
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

        const safeZones = await emergencyService.getNearestSafeZones(queryLocation);
        return safeZones;
      } catch (error) {
        console.error("Failed to fetch nearest safe zones:", error);
        return [];
      }
    },
    [],
  );

  // On mount, restore any emergency that was active in a previous session.
  useEffect(() => {
    fetchActiveEmergency();
  }, [fetchActiveEmergency]);

  const contextValue: EmergencyContextType = {
    activeEmergency,
    setActiveEmergency,
    fetchActiveEmergency,
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
