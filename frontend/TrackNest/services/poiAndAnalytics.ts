import { getBaseUrl } from "@/utils";
import { getAuthMetadata } from "@/utils/auth";
import axios from "axios";

// POI Types
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

// Crime Heatmap Types
export interface CrimeHeatmapPoint {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  severity: number; // 1-5
  type: string;
  timestamp: string;
}

export interface CrimeAnalytics {
  totalCrimes: number;
  highRiskAreas: CrimeHeatmapPoint[];
  recentCrimes: CrimeHeatmapPoint[];
  riskLevel: "low" | "medium" | "high";
}

// Create POI Input
export interface CreatePOIInput {
  name: string;
  category: POICategory;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  description?: string;
}

// POI Service
class POIService {
  private baseUrl: string = "";

  private async getApiClient() {
    if (!this.baseUrl) {
      this.baseUrl = await getBaseUrl();
    }
    const authMetadata = await getAuthMetadata();
    return axios.create({
      baseURL: this.baseUrl,
      headers: authMetadata,
    });
  }

  // POI CRUD operations would go here if backend supports it
  // For now, we store POIs locally

  // Get nearby POIs by category
  getLocalPOIs(category?: POICategory): PointOfInterest[] {
    // Default POIs for the app - in production, these would come from a backend API
    const defaultPOIs: PointOfInterest[] = [
      { id: "poi_1", name: "Central Police Station", category: "police_station", latitude: 10.7769, longitude: 106.7009, address: "123 Main St", phone: "911", description: "24/7 Police Services" },
      { id: "poi_2", name: "City Hospital", category: "hospital", latitude: 10.7879, longitude: 106.6889, address: "456 Health Ave", phone: "108", description: "Emergency Medical Services" },
      { id: "poi_3", name: "Fire Station #1", category: "fire_station", latitude: 10.7759, longitude: 106.7109, address: "789 Fire Rd", phone: "114", description: "Fire & Rescue Services" },
      { id: "poi_4", name: "Public School", category: "school", latitude: 10.7829, longitude: 106.6959, address: "321 Education Blvd", description: "Elementary School" },
      { id: "poi_5", name: "24/7 Pharmacy", category: "pharmacy", latitude: 10.7819, longitude: 106.7029, address: "654 Medicine St", description: "Pharmacy Services" },
      { id: "poi_6", name: "Central Park", category: "park", latitude: 10.7769, longitude: 106.7059, description: "Public Park" },
    ];

    if (category) {
      return defaultPOIs.filter(poi => poi.category === category);
    }
    return defaultPOIs;
  }

  // Get POI icons based on category
  getPOIIcon(category: POICategory): string {
    const icons: Record<POICategory, string> = {
      police_station: "shield",
      hospital: "medkit",
      school: "school",
      fire_station: "flame",
      pharmacy: "medical",
      bank: "card",
      shopping_mall: "cart",
      public_transport: "bus",
      park: "leaf",
      other: "location",
    };
    return icons[category] || "location";
  }

  // Get POI color based on category
  getPOIColor(category: POICategory): string {
    const colors: Record<POICategory, string> = {
      police_station: "#1a73e8",     // Blue
      hospital: "#ea4335",            // Red
      school: "#fbbc04",              // Yellow
      fire_station: "#ff6d00",        // Orange
      pharmacy: "#34a853",            // Green
      bank: "#7b1fa2",               // Purple
      shopping_mall: "#00acc1",       // Cyan
      public_transport: "#5f6368",   // Gray
      park: "#4caf50",                // Light Green
      other: "#757575",               // Dark Gray
    };
    return colors[category] || "#757575";
  }
}

// Crime Analytics Service
class CrimeAnalyticsService {
  private baseUrl: string = "";

  private async getApiClient() {
    if (!this.baseUrl) {
      this.baseUrl = await getBaseUrl();
    }
    const authMetadata = await getAuthMetadata();
    return axios.create({
      baseURL: this.baseUrl,
      headers: authMetadata,
    });
  }

  /**
   * Get crime heatmap data around a location
   */
  async getCrimeHeatmap(
    longitude: number,
    latitude: number,
    radius: number = 5000,
    page: number = 0,
    size: number = 50
  ): Promise<{
    content: CrimeHeatmapPoint[];
    totalElements: number;
    totalPages: number;
  }> {
    const client = await this.getApiClient();
    const response = await client.get("/crime-locator/heatmap", {
      params: { longitude, latitude, radius, page, size },
    });

    const data = response.data;
    return {
      content: data.content.map((crime: any) => ({
        id: crime.id,
        title: crime.title,
        latitude: crime.latitude,
        longitude: crime.longitude,
        severity: crime.severity,
        type: "Crime", // Could be expanded based on backend data
        timestamp: crime.createdAt || crime.updatedAt,
      })),
      totalElements: data.totalElements,
      totalPages: data.totalPages,
    };
  }

  /**
   * Check if current location is in a high-risk crime zone
   */
  async checkHighRiskZone(longitude: number, latitude: number): Promise<boolean> {
    const client = await this.getApiClient();
    const response = await client.get("/crime-locator/high-risk-check", {
      params: { longitude, latitude },
    });
    return response.data;
  }

  /**
   * Get crime severity color for UI
   */
  getSeverityColor(severity: number): string {
    if (severity >= 4) return "#e74c3c"; // High - Red
    if (severity >= 3) return "#f39c12"; // Medium - Orange
    if (severity >= 2) return "#f1c40f"; // Low-Medium - Yellow
    return "#27ae60"; // Low - Green
  }

  /**
   * Get heatmap circle radius based on severity
   */
  getHeatmapRadius(severity: number): number {
    // Higher severity = larger radius
    return 100 + (severity * 50);
  }

  /**
   * Get heatmap opacity based on severity
   */
  getHeatmapOpacity(severity: number): number {
    // Higher severity = higher opacity
    return 0.3 + (severity * 0.15);
  }

  /**
   * Calculate overall risk level based on nearby crimes
   */
  calculateRiskLevel(crimeCount: number, maxSeverity: number): "low" | "medium" | "high" {
    if (crimeCount === 0) return "low";
    if (crimeCount >= 10 || maxSeverity >= 5) return "high";
    if (crimeCount >= 5 || maxSeverity >= 4) return "medium";
    return "low";
  }
}

// Export singleton instances
export const poiService = new POIService();
export const crimeAnalyticsService = new CrimeAnalyticsService();

export default { poiService, crimeAnalyticsService };