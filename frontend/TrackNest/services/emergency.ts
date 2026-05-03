import { getEmergencyUrl } from "@/utils";
import { getAuthMetadata } from "@/utils/auth";
import axios from "axios";
import {
  EmergencyStatus,
  type AcceptEmergencyRequestResponse,
  type CheckEmergencyRequestAllowedResponse,
  type CloseEmergencyRequestResponse,
  type CreateEmergencyRequestData,
  type DeleteSafeZoneResponse,
  type EmergencyRequest,
  type EmergencyResponderTarget,
  type EmergencyServiceLocation,
  type Location,
  type NearestSafeZonesQuery,
  type PageResponse,
  type PatchEmergencyServiceLocationResponse,
  type PostEmergencyRequestResponse,
  type PostSafeZoneResponse,
  type PutSafeZoneResponse,
  type RejectEmergencyRequestResponse,
  type SafeZone,
} from "@/types/emergency";

export {
  EmergencyStatus,
  type AcceptEmergencyRequestResponse,
  type CheckEmergencyRequestAllowedResponse,
  type CloseEmergencyRequestResponse,
  type CreateEmergencyRequestData,
  type DeleteSafeZoneResponse,
  type EmergencyRequest,
  type EmergencyResponderTarget,
  type EmergencyServiceLocation,
  type Location,
  type NearestSafeZonesQuery,
  type PageResponse,
  type PatchEmergencyServiceLocationResponse,
  type PostEmergencyRequestResponse,
  type PostSafeZoneResponse,
  type PutSafeZoneResponse,
  type RejectEmergencyRequestResponse,
  type SafeZone,
};

class EmergencyOperationsService {
  private baseUrl: string = "";

  private async getApiClient() {
    if (!this.baseUrl) {
      this.baseUrl = await getEmergencyUrl();
    }

    console.log("Using emergency service URL:", this.baseUrl);

    const authMetadata = await getAuthMetadata();
    return axios.create({
      baseURL: this.baseUrl,
      headers: authMetadata,
    });
  }

  async createEmergencyRequest(
    data: CreateEmergencyRequestData,
  ): Promise<PostEmergencyRequestResponse> {
    const client = await this.getApiClient();
    const response = await client.post(
      "/emergency-request-receiver/request",
      data,
    );
    return response.data;
  }

  async checkEmergencyRequestAllowed(
    targetId: string,
  ): Promise<CheckEmergencyRequestAllowedResponse> {
    const client = await this.getApiClient();
    const response = await client.get(
      `/emergency-request-receiver/user/${targetId}/emergency-request-allowed`,
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
      { params: { status: EmergencyStatus.PENDING } },
    );
    return response.data.count;
  }

  async acceptEmergencyRequest(
    requestId: string,
  ): Promise<AcceptEmergencyRequestResponse> {
    const client = await this.getApiClient();
    const response = await client.patch(
      `/emergency-request-manager/requests/${requestId}/accept`,
    );
    return response.data;
  }

  async rejectEmergencyRequest(
    requestId: string,
  ): Promise<RejectEmergencyRequestResponse> {
    const client = await this.getApiClient();
    const response = await client.patch(
      `/emergency-request-manager/requests/${requestId}/reject`,
    );
    return response.data;
  }

  async closeEmergencyRequest(
    requestId: string,
  ): Promise<CloseEmergencyRequestResponse> {
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
  ): Promise<PatchEmergencyServiceLocationResponse> {
    const client = await this.getApiClient();
    const response = await client.patch(
      `/emergency-request-manager/emergency-service/location`,
      {
        latitudeDegrees: location.latitude,
        longitudeDegrees: location.longitude,
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

  async createSafeZone(
    safeZone: Omit<SafeZone, "id" | "createdAt" | "emergencyServiceId">,
  ): Promise<PostSafeZoneResponse> {
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
  ): Promise<PutSafeZoneResponse> {
    const client = await this.getApiClient();
    const response = await client.put(`/safe-zone-manager/safe-zone/${id}`, {
      name: safeZone.name,
      latitudeDegrees: safeZone.latitude,
      longitudeDegrees: safeZone.longitude,
      radiusMeters: safeZone.radius,
    });
    return response.data;
  }

  async deleteSafeZone(id: string): Promise<DeleteSafeZoneResponse> {
    const client = await this.getApiClient();
    const response = await client.delete(`/safe-zone-manager/safe-zone/${id}`);
    return response.data;
  }
}

export const emergencyService = new EmergencyOperationsService();
export default emergencyService;
