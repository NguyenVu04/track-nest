import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import type {
  PointOfInterest,
  POICategory,
  CrimeHeatmapPoint,
  CrimeAnalytics,
  CreatePOIInput,
} from "@/types/poiAndAnalytics";
import { poiService, crimeAnalyticsService } from "@/services/poiAndAnalytics";
import { getPOIIcon, getPOIColor, calculateRiskLevel } from "@/utils/poiHelpers";
import { useAuth } from "./AuthContext";
import * as Location from "expo-location";

interface POIAnalyticsContextType {
  // POIs
  nearbyPOIs: PointOfInterest[];
  selectedPOICategory: POICategory | null;
  setSelectedPOICategory: (category: POICategory | null) => void;
  loadNearbyPOIs: (category?: POICategory) => void;

  // Crime Heatmap
  crimeHeatmapPoints: CrimeHeatmapPoint[];
  isLoadingHeatmap: boolean;
  loadCrimeHeatmap: (latitude: number, longitude: number, radius?: number) => Promise<void>;
  clearCrimeHeatmap: () => void;

  // High Risk Zone
  isHighRiskZone: boolean;
  checkHighRiskZone: (latitude: number, longitude: number) => Promise<void>;

  // Risk Assessment
  riskLevel: "low" | "medium" | "high";
  crimeCount: number;

  // Helpers
  getPOIIcon: (category: POICategory) => string;
  getPOIColor: (category: POICategory) => string;
}

const POIAnalyticsContext = createContext<POIAnalyticsContextType | undefined>(undefined);

export const usePOIAnalytics = (): POIAnalyticsContextType => {
  const context = useContext(POIAnalyticsContext);
  if (context === undefined) {
    throw new Error("usePOIAnalytics must be used within a POIAnalyticsProvider");
  }
  return context;
};

interface POIAnalyticsProviderProps {
  children: ReactNode;
}

export const POIAnalyticsProvider: React.FC<POIAnalyticsProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // POI State
  const [nearbyPOIs, setNearbyPOIs] = useState<PointOfInterest[]>([]);
  const [selectedPOICategory, setSelectedPOICategory] = useState<POICategory | null>(null);

  // Crime Heatmap State
  const [crimeHeatmapPoints, setCrimeHeatmapPoints] = useState<CrimeHeatmapPoint[]>([]);
  const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(false);

  // High Risk State
  const [isHighRiskZone, setIsHighRiskZone] = useState(false);

  // Risk Assessment
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("low");
  const [crimeCount, setCrimeCount] = useState(0);

  // Load nearby POIs
  const loadNearbyPOIs = useCallback((category?: POICategory) => {
    const pois = poiService.getLocalPOIs(category);
    setNearbyPOIs(pois);
  }, []);

  // Load crime heatmap
  const loadCrimeHeatmap = useCallback(async (
    latitude: number,
    longitude: number,
    radius: number = 5000
  ) => {
    setIsLoadingHeatmap(true);
    try {
      const response = await crimeAnalyticsService.getCrimeHeatmap(
        longitude,
        latitude,
        radius,
        0,
        50
      );
      
      setCrimeHeatmapPoints(response.content);
      setCrimeCount(response.totalElements);

      // Calculate risk level
      const maxSeverity = response.content.reduce((max, crime) => 
        Math.max(max, crime.severity), 0
      );
      const level = calculateRiskLevel(response.totalElements, maxSeverity);
      setRiskLevel(level);
    } catch (error) {
      console.error("Failed to load crime heatmap:", error);
      setCrimeHeatmapPoints([]);
      setCrimeCount(0);
      setRiskLevel("low");
    } finally {
      setIsLoadingHeatmap(false);
    }
  }, []);

  // Clear crime heatmap
  const clearCrimeHeatmap = useCallback(() => {
    setCrimeHeatmapPoints([]);
    setCrimeCount(0);
    setRiskLevel("low");
    setIsHighRiskZone(false);
  }, []);

  // Check high risk zone
  const checkHighRiskZone = useCallback(async (latitude: number, longitude: number) => {
    try {
      const isHighRisk = await crimeAnalyticsService.checkHighRiskZone(longitude, latitude);
      setIsHighRiskZone(isHighRisk);
    } catch (error) {
      console.error("Failed to check high risk zone:", error);
      setIsHighRiskZone(false);
    }
  }, []);

  // Helper functions
  const getPOIIconCallback = useCallback((category: POICategory) => {
    return getPOIIcon(category);
  }, []);

  const getPOIColorCallback = useCallback((category: POICategory) => {
    return getPOIColor(category);
  }, []);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      loadNearbyPOIs();
    }
  }, [isAuthenticated, loadNearbyPOIs]);

  // Context value
  const contextValue: POIAnalyticsContextType = {
    // POIs
    nearbyPOIs,
    selectedPOICategory,
    setSelectedPOICategory,
    loadNearbyPOIs,

    // Crime Heatmap
    crimeHeatmapPoints,
    isLoadingHeatmap,
    loadCrimeHeatmap,
    clearCrimeHeatmap,

    // High Risk Zone
    isHighRiskZone,
    checkHighRiskZone,

    // Risk Assessment
    riskLevel,
    crimeCount,

    // Helpers
    getPOIIcon: getPOIIconCallback,
    getPOIColor: getPOIColorCallback,
  };

  return (
    <POIAnalyticsContext.Provider value={contextValue}>
      {children}
    </POIAnalyticsContext.Provider>
  );
};

export default POIAnalyticsContext;