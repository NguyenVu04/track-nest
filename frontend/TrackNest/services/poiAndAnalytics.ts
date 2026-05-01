import { getCriminalUrl } from "@/utils";
import { getAuthMetadata } from "@/utils/auth";
import axios from "axios";
import type {
  CrimeHeatmapPoint,
  PointOfInterest,
  POICategory,
} from "@/types/poiAndAnalytics";
export type {
  CrimeAnalytics,
  CrimeHeatmapPoint,
  CreatePOIInput,
  PointOfInterest,
  POICategory,
} from "@/types/poiAndAnalytics";

class POIService {
  private baseUrl: string = "";

  private async getApiClient() {
    if (!this.baseUrl) {
      this.baseUrl = await getCriminalUrl();
    }
    const authMetadata = await getAuthMetadata();
    return axios.create({
      baseURL: this.baseUrl,
      headers: authMetadata,
    });
  }

  getLocalPOIs(category?: POICategory): PointOfInterest[] {
    const defaultPOIs: PointOfInterest[] = [
      { id: "poi_1", name: "Central Police Station", category: "police_station", latitude: 10.7769, longitude: 106.7009, address: "123 Main St", phone: "911", description: "24/7 Police Services" },
      { id: "poi_2", name: "City Hospital", category: "hospital", latitude: 10.7879, longitude: 106.6889, address: "456 Health Ave", phone: "108", description: "Emergency Medical Services" },
      { id: "poi_3", name: "Fire Station #1", category: "fire_station", latitude: 10.7759, longitude: 106.7109, address: "789 Fire Rd", phone: "114", description: "Fire & Rescue Services" },
      { id: "poi_4", name: "Public School", category: "school", latitude: 10.7829, longitude: 106.6959, address: "321 Education Blvd", description: "Elementary School" },
      { id: "poi_5", name: "24/7 Pharmacy", category: "pharmacy", latitude: 10.7819, longitude: 106.7029, address: "654 Medicine St", description: "Pharmacy Services" },
      { id: "poi_6", name: "Central Park", category: "park", latitude: 10.7769, longitude: 106.7059, description: "Public Park" },
    ];

    if (category) {
      return defaultPOIs.filter((poi) => poi.category === category);
    }
    return defaultPOIs;
  }
}

class CrimeAnalyticsService {
  private baseUrl: string = "";

  private async getApiClient() {
    if (!this.baseUrl) {
      this.baseUrl = await getCriminalUrl();
    }
    const authMetadata = await getAuthMetadata();
    return axios.create({
      baseURL: this.baseUrl,
      headers: authMetadata,
    });
  }

  async getCrimeHeatmap(
    longitude: number,
    latitude: number,
    radius: number = 5000,
    page: number = 0,
    size: number = 50,
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
        type: "Crime",
        timestamp: crime.createdAt || crime.updatedAt,
      })),
      totalElements: data.totalElements,
      totalPages: data.totalPages,
    };
  }

  async checkHighRiskZone(longitude: number, latitude: number): Promise<boolean> {
    const client = await this.getApiClient();
    const response = await client.get("/crime-locator/high-risk-check", {
      params: { longitude, latitude },
    });
    return response.data;
  }
}

export const poiService = new POIService();
export const crimeAnalyticsService = new CrimeAnalyticsService();

export default { poiService, crimeAnalyticsService };
