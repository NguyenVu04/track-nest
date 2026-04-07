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
  async createEmergencyRequest(data: CreateEmergencyRequestData): Promise<{ id: string; createdAtMs: number }> {
    const client = await this.getApiClient();
    const response = await client.post("/emergency-request-receiver/request", data);
    return response.data;
  }

  async getMyEmergencyRequests(page: number = 0, size: number = 20): Promise<{
    items: EmergencyRequest[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  }> {
    const client = await this.getApiClient();
    const response = await client.get(`/emergency-request-receiver/requests`, {
      params: { page, size }
    });
    return response.data;
  }

  async getEmergencyRequestsByStatus(status: EmergencyStatus, page: number = 0, size: number = 20): Promise<{
    items: EmergencyRequest[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  }> {
    const client = await this.getApiClient();
    const response = await client.get(`/emergency-request-manager/requests`, {
      params: { status, page, size }
    });
    return response.data;
  }

  async getPendingEmergencyRequestsCount(): Promise<number> {
    const client = await this.getApiClient();
    const response = await client.get(`/emergency-request-manager/requests/count`, {
      params: { status: EmergencyStatus.PENDING }
    });
    return response.data.count;
  }

  // Emergency Service Management (for responders)
  async acceptEmergencyRequest(requestId: string): Promise<{ id: string; acceptedAtMs: number }> {
    const client = await this.getApiClient();
    const response = await client.patch(`/emergency-request-manager/requests/${requestId}/accept`);
    return response.data;
  }

  async rejectEmergencyRequest(requestId: string): Promise<{ id: string; rejectedAtMs: number }> {
    const client = await this.getApiClient();
    const response = await client.patch(`/emergency-request-manager/requests/${requestId}/reject`);
    return response.data;
  }

  async closeEmergencyRequest(requestId: string): Promise<{ id: string; closedAtMs: number }> {
    const client = await this.getApiClient();
    const response = await client.patch(`/emergency-request-manager/requests/${requestId}/close`);
    return response.data;
  }

  async updateEmergencyServiceLocation(location: Location): Promise<{ id: string; updatedAtMs: number }> {
    const client = await this.getApiClient();
    const response = await client.patch(`/emergency-request-manager/emergency-service/location`, {
      latitudeDegrees: location.latitude,
      longitudeDegrees: location.longitude,
    });
    return response.data;
  }

  // Safe Zone Management
  async getNearestSafeZones(query: NearestSafeZonesQuery): Promise<SafeZone[]> {
    const client = await this.getApiClient();
    const response = await client.get(`/safe-zone-locator/safe-zones/nearest`, {
      params: {
        latitudeDegrees: query.lat,
        longitudeDegrees: query.lng,
        maxDistanceMeters: query.maxDistance ?? 5000,
        maxNumberOfSafeZones: query.maxNumber ?? 10,
      }
    });
    // Map backend field names to our SafeZone interface
    return (response.data as any[]).map((z) => ({
      id: z.safeZoneId,
      name: z.safeZoneName,
      latitude: z.latitudeDegrees,
      longitude: z.longitudeDegrees,
      radius: z.radiusMeters,
    }));
  }

  async createSafeZone(safeZone: Omit<SafeZone, "id">): Promise<{ id: string; createdAtMs: number }> {
    const client = await this.getApiClient();
    const response = await client.post(`/safe-zone-manager/safe-zone`, {
      name: safeZone.name,
      latitudeDegrees: safeZone.latitude,
      longitudeDegrees: safeZone.longitude,
      radiusMeters: safeZone.radius,
    });
    return response.data;
  }

  async getSafeZones(page: number = 0, size: number = 20): Promise<SafeZone[]> {
    const client = await this.getApiClient();
    const response = await client.get(`/safe-zone-manager/safe-zones`, {
      params: { page, size }
    });
    const items = response.data.items ?? [];
    return items.map((z: any) => ({
      id: z.id,
      name: z.name,
      latitude: z.latitudeDegrees,
      longitude: z.longitudeDegrees,
      radius: z.radiusMeters,
    }));
  }

  async updateSafeZone(id: string, safeZone: Partial<SafeZone>): Promise<{ id: string; updatedAtMs: number }> {
    const client = await this.getApiClient();
    const body: Record<string, any> = {};
    if (safeZone.name !== undefined) body.name = safeZone.name;
    if (safeZone.latitude !== undefined) body.latitudeDegrees = safeZone.latitude;
    if (safeZone.longitude !== undefined) body.longitudeDegrees = safeZone.longitude;
    if (safeZone.radius !== undefined) body.radiusMeters = safeZone.radius;
    const response = await client.put(`/safe-zone-manager/safe-zone/${id}`, body);
    return response.data;
  }

  async deleteSafeZone(id: string): Promise<{ id: string; deletedAtMs: number }> {
    const client = await this.getApiClient();
    const response = await client.delete(`/safe-zone-manager/safe-zone/${id}`);
    return response.data;
  }
}

// Export singleton instance
export const emergencyService = new EmergencyOperationsService();
export default emergencyService;
