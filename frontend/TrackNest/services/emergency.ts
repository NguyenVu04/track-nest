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
  openAt: string;
  closeAt?: string;
  senderId: string;
  targetId: string;
  emergencyServiceId: string;
  statusName: "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED";
  longitude: number;
  latitude: number;
}

export enum EmergencyStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
}

export interface SafeZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  createdAt: string;
  emergencyServiceId: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface EmergencyServiceLocation {
  emergencyServiceId: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

export interface EmergencyResponderTarget {
  userId: string;
  lastLatitude: number;
  lastLongitude: number;
  lastUpdateTime: string;
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
  async createEmergencyRequest(
    data: CreateEmergencyRequestData,
  ): Promise<EmergencyRequest> {
    const client = await this.getApiClient();
    const response = await client.post(
      "/emergency-request-receiver/request",
      data,
    );
    return response.data;
  }

  async getMyEmergencyRequests(
    page: number = 0,
    size: number = 20,
  ): Promise<PageResponse<EmergencyRequest>> {
    const client = await this.getApiClient();
    const response = await client.get(`/emergency-request-receiver/requests`, {
      params: { page, size },
    });
    return response.data;
  }

  async getEmergencyRequestsByStatus(
    status: EmergencyStatus,
    page: number = 0,
    size: number = 20,
  ): Promise<PageResponse<EmergencyRequest>> {
    const client = await this.getApiClient();
    const response = await client.get(`/emergency-request-manager/requests`, {
      params: { status, page, size },
    });
    return response.data;
  }

  async getPendingEmergencyRequestsCount(): Promise<number> {
    const client = await this.getApiClient();
    const response = await client.get(
      `/emergency-request-manager/requests/count`,
      {
        params: { status: EmergencyStatus.PENDING },
      },
    );
    return response.data.count;
  }

  // Emergency Service Management (for responders)
  async acceptEmergencyRequest(
    requestId: string,
  ): Promise<EmergencyRequest> {
    const client = await this.getApiClient();
    const response = await client.patch(
      `/emergency-request-manager/requests/${requestId}/accept`,
    );
    return response.data;
  }

  async rejectEmergencyRequest(
    requestId: string,
  ): Promise<EmergencyRequest> {
    const client = await this.getApiClient();
    const response = await client.patch(
      `/emergency-request-manager/requests/${requestId}/reject`,
    );
    return response.data;
  }

  async closeEmergencyRequest(
    requestId: string,
  ): Promise<EmergencyRequest> {
    const client = await this.getApiClient();
    const response = await client.patch(
      `/emergency-request-manager/requests/${requestId}/close`,
    );
    return response.data;
  }

  async getEmergencyServiceLocation(): Promise<EmergencyServiceLocation> {
    const client = await this.getApiClient();
    const response = await client.get(
      `/emergency-request-manager/emergency-service/location`,
    );
    return response.data;
  }

  async updateEmergencyServiceLocation(
    location: Location,
  ): Promise<EmergencyServiceLocation> {
    const client = await this.getApiClient();
    const response = await client.patch(
      `/emergency-request-manager/emergency-service/location`,
      {
        latitude: location.latitude,
        longitude: location.longitude,
      },
    );
    return response.data;
  }

  async getEmergencyResponderTargets(
    page: number = 0,
    size: number = 20,
  ): Promise<PageResponse<EmergencyResponderTarget>> {
    const client = await this.getApiClient();
    const response = await client.get(`/emergency-responder/targets`, {
      params: { page, size },
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
      },
    });
    // Backend returns { safeZoneId, safeZoneName, latitudeDegrees, longitudeDegrees, radiusMeters }
    return response.data.map((item: {
      safeZoneId: string;
      safeZoneName: string;
      latitudeDegrees: number;
      longitudeDegrees: number;
      radiusMeters: number;
    }): SafeZone => ({
      id: item.safeZoneId,
      name: item.safeZoneName,
      latitude: item.latitudeDegrees,
      longitude: item.longitudeDegrees,
      radius: item.radiusMeters,
      createdAt: "",
      emergencyServiceId: "",
    }));
  }

  async createSafeZone(safeZone: Omit<SafeZone, "id" | "createdAt" | "emergencyServiceId">): Promise<SafeZone> {
    const client = await this.getApiClient();
    const response = await client.post(`/safe-zone-manager/safe-zone`, {
      name: safeZone.name,
      latitudeDegrees: safeZone.latitude,
      longitudeDegrees: safeZone.longitude,
      radiusMeters: safeZone.radius,
    });
    return response.data;
  }

  async getSafeZones(
    page: number = 0,
    size: number = 20,
    nameFilter?: string,
  ): Promise<PageResponse<SafeZone>> {
    const client = await this.getApiClient();
    const response = await client.get(`/safe-zone-manager/safe-zones`, {
      params: { page, size, nameFilter },
    });
    return response.data;
  }

  async updateSafeZone(
    id: string,
    safeZone: Partial<Pick<SafeZone, "name" | "latitude" | "longitude" | "radius">>,
  ): Promise<SafeZone> {
    const client = await this.getApiClient();
    const response = await client.put(
      `/safe-zone-manager/safe-zone/${id}`,
      {
        name: safeZone.name,
        latitudeDegrees: safeZone.latitude,
        longitudeDegrees: safeZone.longitude,
        radiusMeters: safeZone.radius,
      },
    );
    return response.data;
  }

  async deleteSafeZone(id: string): Promise<{ id: string; deleted: boolean }> {
    const client = await this.getApiClient();
    const response = await client.delete(`/safe-zone-manager/safe-zone/${id}`);
    return response.data;
  }
}

// Export singleton instance
export const emergencyService = new EmergencyOperationsService();
export default emergencyService;
