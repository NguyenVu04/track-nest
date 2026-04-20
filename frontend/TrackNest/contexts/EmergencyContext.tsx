import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import {
  EmergencyRequest,
  EmergencyStatus,
  SafeZone,
  CreateEmergencyRequestData,
  emergencyService,
} from "@/services/emergency";
import * as Location from "expo-location";

interface EmergencyContextType {
  // Emergency Requests (simplified for SOS-only usage)
  activeEmergency: EmergencyRequest | null;
  
  // Actions (only what's needed for SOS screen)
  createEmergencyRequest: (targetId: string) => Promise<EmergencyRequest>;
  
  // Safe Zone actions (for finding nearest safe locations during emergency)
  getNearestSafeZones: (location?: {lat: number; lng: number}) => Promise<SafeZone[]>;
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

export const EmergencyProvider: React.FC<EmergencyProviderProps> = ({
  children,
}) => {
  // Simplified state for SOS-only usage
  const [activeEmergency, setActiveEmergency] = useState<EmergencyRequest | null>(null);

  // Create emergency request (called only from SOS screen timeout)
  const createEmergencyRequest = useCallback(async (targetId: string): Promise<EmergencyRequest> => {
    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const requestData: CreateEmergencyRequestData = {
        targetId,
        lastLatitudeDegrees: location.coords.latitude,
        lastLongitudeDegrees: location.coords.longitude,
      };

      const newRequest = await emergencyService.createEmergencyRequest(requestData);
      
      // Track active emergency for potential future use
      if (newRequest.status === EmergencyStatus.PENDING) {
        setActiveEmergency(newRequest);
      }
      
      return newRequest;
    } catch (error) {
      console.error("Failed to create emergency request:", error);
      throw error;
    }
  }, []);

  // Get nearest safe zones (for emergency situations)
  const getNearestSafeZones = useCallback(async (location?: {lat: number; lng: number}): Promise<SafeZone[]> => {
    try {
      let queryLocation = location;
      
      if (!queryLocation) {
        // Get current location if not provided
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
  }, []);

  // Context value (simplified for SOS-only usage)
  const contextValue: EmergencyContextType = {
    activeEmergency,
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