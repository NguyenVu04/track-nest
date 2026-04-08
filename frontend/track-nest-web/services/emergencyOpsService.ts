import axios from "axios";
import { authService } from "./authService";

const API_URL =
  process.env.NEXT_PUBLIC_EMERGENCY_OPS_API_URL || "http://localhost:28080";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    try {
      await authService.refreshToken();
    } catch {
      // Keep fallback behavior for unauthenticated/public requests.
    }

    const token =
      authService.getAccessToken() || localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Request / Response Types ─────────────────────────────────────────────────

export interface CreateEmergencyRequestRequest {
  targetId: string;
  lastLatitudeDegrees: number;
  lastLongitudeDegrees: number;
}

export interface EmergencyRequestResponse {
  id: string;
  openAt: string;
  closeAt?: string;
  senderId: string;
  targetId: string;
  emergencyServiceId: string;
  status: string;
  longitude: number;
  latitude: number;
}

export interface UpdateEmergencyServiceLocationRequest {
  latitude: number;
  longitude: number;
}

export interface EmergencyServiceLocationResponse {
  emergencyServiceId: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

export interface EmergencyServiceTargetsResponse {
  userId: string;
  lastLatitude: number;
  lastLongitude: number;
  lastUpdateTime: string;
}

export interface RequestCountResponse {
  count: number;
}

export interface CreateSafeZoneRequest {
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

export interface SafeZoneResponse {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  createdAt: string;
  emergencyServiceId: string;
}

export interface NearestSafeZoneResponse {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  distanceMeters: number;
  emergencyServiceId: string;
}

export interface DeleteSafeZoneResponse {
  id: string;
  deleted: boolean;
}

export interface PageResponse<T> {
  items: T[];
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const emergencyOpsService = {
  // ── Emergency Request Receiver (User role) ────────────────────────────────

  /** Submit a new emergency request (User). */
  createEmergencyRequest: async (
    data: CreateEmergencyRequestRequest,
  ): Promise<EmergencyRequestResponse> => {
    const response = await api.post<EmergencyRequestResponse>(
      "/emergency-request-receiver/request",
      data,
    );
    return response.data;
  },

  /** List emergency requests submitted by the current user. */
  getUserEmergencyRequests: async (
    page = 0,
    size = 10,
  ): Promise<PageResponse<EmergencyRequestResponse>> => {
    const response = await api.get<PageResponse<EmergencyRequestResponse>>(
      "/emergency-request-receiver/requests",
      { params: { page, size } },
    );
    return response.data;
  },

  // ── Emergency Request Manager (Emergency Services role) ───────────────────

  /** List requests assigned to the authenticated emergency service. */
  getEmergencyRequests: async (
    status?: string,
    page = 0,
    size = 10,
  ): Promise<PageResponse<EmergencyRequestResponse>> => {
    const response = await api.get<PageResponse<EmergencyRequestResponse>>(
      "/emergency-request-manager/requests",
      { params: { status, page, size } },
    );
    return response.data;
  },

  /** Get request count for the authenticated emergency service. */
  getEmergencyRequestCount: async (
    status?: string,
  ): Promise<RequestCountResponse> => {
    const response = await api.get<RequestCountResponse>(
      "/emergency-request-manager/requests/count",
      { params: { status } },
    );
    return response.data;
  },

  /** Accept a pending emergency request. */
  acceptEmergencyRequest: async (
    requestId: string,
  ): Promise<EmergencyRequestResponse> => {
    const response = await api.patch<EmergencyRequestResponse>(
      `/emergency-request-manager/requests/${requestId}/accept`,
    );
    return response.data;
  },

  /** Reject a pending emergency request. */
  rejectEmergencyRequest: async (
    requestId: string,
  ): Promise<EmergencyRequestResponse> => {
    const response = await api.patch<EmergencyRequestResponse>(
      `/emergency-request-manager/requests/${requestId}/reject`,
    );
    return response.data;
  },

  /** Close (complete) an accepted emergency request. */
  closeEmergencyRequest: async (
    requestId: string,
  ): Promise<EmergencyRequestResponse> => {
    const response = await api.patch<EmergencyRequestResponse>(
      `/emergency-request-manager/requests/${requestId}/close`,
    );
    return response.data;
  },

  /** Update the authenticated emergency service's location. */
  updateEmergencyServiceLocation: async (
    data: UpdateEmergencyServiceLocationRequest,
  ): Promise<EmergencyServiceLocationResponse> => {
    const response = await api.patch<EmergencyServiceLocationResponse>(
      "/emergency-request-manager/emergency-service/location",
      data,
    );
    return response.data;
  },

  /** Get the authenticated emergency service's last known location. */
  getEmergencyServiceLocation:
    async (): Promise<EmergencyServiceLocationResponse> => {
      const response = await api.get<EmergencyServiceLocationResponse>(
        "/emergency-request-manager/emergency-service/location",
      );
      return response.data;
    },

  // ── Emergency Responder (Emergency Services role) ─────────────────────────

  /** List users (targets) with active accepted requests for this service. */
  getEmergencyServiceTargets: async (
    page = 0,
    size = 10,
  ): Promise<PageResponse<EmergencyServiceTargetsResponse>> => {
    const response = await api.get<PageResponse<EmergencyServiceTargetsResponse>>(
      "/emergency-responder/targets",
      { params: { page, size } },
    );
    return response.data;
  },

  // ── Safe Zone Manager (Emergency Services role) ───────────────────────────

  /** Create a new safe zone. */
  createSafeZone: async (
    data: CreateSafeZoneRequest,
  ): Promise<SafeZoneResponse> => {
    const response = await api.post<SafeZoneResponse>(
      "/safe-zone-manager/safe-zone",
      data,
    );
    return response.data;
  },

  /** List safe zones owned by the authenticated service. */
  getSafeZones: async (
    nameFilter?: string,
    page = 0,
    size = 20,
  ): Promise<PageResponse<SafeZoneResponse>> => {
    const response = await api.get<PageResponse<SafeZoneResponse>>(
      "/safe-zone-manager/safe-zones",
      { params: { nameFilter, page, size } },
    );
    return response.data;
  },

  /** Update a safe zone. */
  updateSafeZone: async (
    safeZoneId: string,
    data: CreateSafeZoneRequest,
  ): Promise<SafeZoneResponse> => {
    const response = await api.put<SafeZoneResponse>(
      `/safe-zone-manager/safe-zone/${safeZoneId}`,
      data,
    );
    return response.data;
  },

  /** Delete a safe zone. */
  deleteSafeZone: async (
    safeZoneId: string,
  ): Promise<DeleteSafeZoneResponse> => {
    const response = await api.delete<DeleteSafeZoneResponse>(
      `/safe-zone-manager/safe-zone/${safeZoneId}`,
    );
    return response.data;
  },

  // ── Safe Zone Locator (all roles) ─────────────────────────────────────────

  /** Find nearest safe zones to a coordinate. */
  getNearestSafeZones: async (
    latitudeDegrees: number,
    longitudeDegrees: number,
    maxDistanceMeters: number,
    maxNumberOfSafeZones = 10,
  ): Promise<NearestSafeZoneResponse[]> => {
    const response = await api.get<NearestSafeZoneResponse[]>(
      "/safe-zone-locator/safe-zones/nearest",
      {
        params: {
          latitudeDegrees,
          longitudeDegrees,
          maxDistanceMeters,
          maxNumberOfSafeZones,
        },
      },
    );
    return response.data;
  },
};
