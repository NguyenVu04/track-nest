import { getEmergencyUrl } from "@/utils";
import { getAuthMetadata } from "@/utils/auth";
import axios from "axios";

// Emergency Types
export interface Location {
  latitude: number;
  longitude: number;
}

export interface EmergencyRequest {
  id: string;
  senderId: string;
  targetId: string;
  lastLatitudeDegrees: number;
  lastLongitudeDegrees: number;
  status: EmergencyStatus;
  createdAt: string;
  updatedAt: string;
}

export enum EmergencyStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  CLOSED = "CLOSED"
}

export interface SafeZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  emergencyService?: EmergencyService;
}

export interface EmergencyService {
  id: string;
  name: string;
  contactInfo: string;
}

export interface CreateEmergencyRequestData {
  targetId: string;
  lastLatitudeDegrees: number;
  lastLongitudeDegrees: number;
}

export interface NearestSafeZonesQuery {
  lat: number;
  lng: number;
  maxDistance?: number;
  maxNumber?: number;
}

// Emergency Operations Service Client
class EmergencyOperationsService {
  private baseUrl: string = "";

  private async getApiClient() {
    if (!this.baseUrl) {
      this.baseUrl = await getEmergencyUrl();
    }
    
    const authMetadata = await getAuthMetadata();
    return axios.create({
      baseURL: this.baseUrl,
      headers: authMetadata,
    });
  }

  // Emergency Request Management
  async createEmergencyRequest(data: CreateEmergencyRequestData): Promise<EmergencyRequest> {
    const client = await this.getApiClient();
    const response = await client.post("/emergency-request-receiver/request", data);
    return response.data;
  }

  async getMyEmergencyRequests(page: number = 0, size: number = 20): Promise<{
    content: EmergencyRequest[];
    totalElements: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
  }> {
    const client = await this.getApiClient();
    const response = await client.get(`/emergency-request-receiver/requests`, {
      params: { page, size }
    });
    return response.data;
  }

  async getEmergencyRequestsByStatus(status: EmergencyStatus): Promise<EmergencyRequest[]> {
    const client = await this.getApiClient();
    const response = await client.get(`/emergency-request-manager/requests`, {
      params: { status }
    });
    return response.data;
  }

  async getPendingEmergencyRequestsCount(): Promise<number> {
    const client = await this.getApiClient();
    const response = await client.get(`/emergency-request-manager/requests/count`, {
      params: { status: EmergencyStatus.PENDING }
    });
    return response.data;
  }

  // Emergency Service Management (for responders)
  async acceptEmergencyRequest(requestId: string): Promise<void> {
    const client = await this.getApiClient();
    await client.patch(`/emergency-request-manager/requests/${requestId}/accept`);
  }

  async rejectEmergencyRequest(requestId: string): Promise<void> {
    const client = await this.getApiClient();
    await client.patch(`/emergency-request-manager/requests/${requestId}/reject`);
  }

  async closeEmergencyRequest(requestId: string): Promise<void> {
    const client = await this.getApiClient();
    await client.patch(`/emergency-request-manager/requests/${requestId}/close`);
  }

  async updateEmergencyServiceLocation(location: Location): Promise<void> {
    const client = await this.getApiClient();
    await client.patch(`/emergency-request-manager/emergency-service/location`, {
      latitude: location.latitude,
      longitude: location.longitude
    });
  }

  async getEmergencyServiceLocation(): Promise<Location> {
    const client = await this.getApiClient();
    const response = await client.get(`/emergency-request-manager/emergency-service/location`);
    return response.data;
  }

  // Safe Zone Management
  async getNearestSafeZones(query: NearestSafeZonesQuery): Promise<SafeZone[]> {
    const client = await this.getApiClient();
    const response = await client.get(`/safe-zone-locator/safe-zones/nearest`, {
      params: {
        lat: query.lat,
        lng: query.lng,
        maxDistance: query.maxDistance || 5000, // 5km default
        maxNumber: query.maxNumber || 10
      }
    });
    return response.data;
  }

  async createSafeZone(safeZone: Omit<SafeZone, 'id'>): Promise<SafeZone> {
    const client = await this.getApiClient();
    const response = await client.post(`/safe-zone-manager/safe-zone`, safeZone);
    return response.data;
  }

  async getSafeZones(): Promise<SafeZone[]> {
    const client = await this.getApiClient();
    const response = await client.get(`/safe-zone-manager/safe-zones`);
    return response.data;
  }

  async updateSafeZone(id: string, safeZone: Partial<SafeZone>): Promise<SafeZone> {
    const client = await this.getApiClient();
    const response = await client.put(`/safe-zone-manager/safe-zone/${id}`, safeZone);
    return response.data;
  }

  async deleteSafeZone(id: string): Promise<void> {
    const client = await this.getApiClient();
    await client.delete(`/safe-zone-manager/safe-zone/${id}`);
  }

  // Emergency Responder
  async getEmergencyTargets(): Promise<any[]> {
    const client = await this.getApiClient();
    const response = await client.get(`/emergency-responder/targets`);
    return response.data;
  }
}

// Export singleton instance
export const emergencyService = new EmergencyOperationsService();
export default emergencyService;