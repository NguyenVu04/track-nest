export interface PointOfInterest {
  id: string;
  name: string;
  category: POICategory;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  description?: string;
  createdAt?: string;
}

export type POICategory =
  | "police_station"
  | "hospital"
  | "school"
  | "fire_station"
  | "pharmacy"
  | "bank"
  | "shopping_mall"
  | "public_transport"
  | "park"
  | "other";

export interface CrimeHeatmapPoint {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  severity: number;
  type: string;
  timestamp: string;
}

export interface CrimeAnalytics {
  totalCrimes: number;
  highRiskAreas: CrimeHeatmapPoint[];
  recentCrimes: CrimeHeatmapPoint[];
  riskLevel: "low" | "medium" | "high";
}

export interface CreatePOIInput {
  name: string;
  category: POICategory;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  description?: string;
}
