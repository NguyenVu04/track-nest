import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_EMERGENCY_OPS_API_URL || "http://localhost:28080";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

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

export interface CreateSafeZoneRequest {
  name: string;
  longitude: number;
  latitude: number;
  radius: number;
}

export interface SafeZoneResponse {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  radius: number;
  createdAt: string;
  emergencyServiceId: string;
}

export interface EmergencyServiceLocationResponse {
  emergencyServiceId: string;
  longitude: number;
  latitude: number;
  updatedAt: string;
}

export interface EmergencyServiceTargetsResponse {
  userId: string;
  lastLatitude: number;
  lastLongitude: number;
  lastUpdateTime: string;
}

export interface EmergencyRequestCountResponse {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  completed: number;
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

export const emergencyOpsService = {
  createEmergencyRequest: async (
    data: CreateEmergencyRequestRequest
  ): Promise<EmergencyRequestResponse> => {
    const response = await api.post<EmergencyRequestResponse>(
      "/emergency-request-receiver/request",
      data
    );
    return response.data;
  },

  getUserEmergencyRequests: async (
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<EmergencyRequestResponse>> => {
    const response = await api.get<PageResponse<EmergencyRequestResponse>>(
      "/emergency-request-receiver/requests",
      { params: { page, size } }
    );
    return response.data;
  },

  getEmergencyRequests: async (
    status?: string,
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<EmergencyRequestResponse>> => {
    const response = await api.get<PageResponse<EmergencyRequestResponse>>(
      "/emergency-request-manager/requests",
      { params: { status, page, size } }
    );
    return response.data;
  },

  acceptEmergencyRequest: async (
    requestId: string
  ): Promise<EmergencyRequestResponse> => {
    const response = await api.post<EmergencyRequestResponse>(
      `/emergency-request-manager/requests/${requestId}/accept`
    );
    return response.data;
  },

  rejectEmergencyRequest: async (
    requestId: string,
    reason?: string
  ): Promise<EmergencyRequestResponse> => {
    const response = await api.post<EmergencyRequestResponse>(
      `/emergency-request-manager/requests/${requestId}/reject`,
      { reason }
    );
    return response.data;
  },

  completeEmergencyRequest: async (
    requestId: string,
    note?: string
  ): Promise<EmergencyRequestResponse> => {
    const response = await api.post<EmergencyRequestResponse>(
      `/emergency-request-manager/requests/${requestId}/complete`,
      { note }
    );
    return response.data;
  },

  getEmergencyRequestCount: async (
    status?: string
  ): Promise<EmergencyRequestCountResponse> => {
    const response = await api.get<EmergencyRequestCountResponse>(
      "/emergency-request-manager/requests/count",
      { params: { status } }
    );
    return response.data;
  },

  createSafeZone: async (
    data: CreateSafeZoneRequest
  ): Promise<SafeZoneResponse> => {
    const response = await api.post<SafeZoneResponse>(
      "/safe-zone-manager/zones",
      data
    );
    return response.data;
  },

  getSafeZones: async (
    nameFilter?: string,
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<SafeZoneResponse>> => {
    const response = await api.get<PageResponse<SafeZoneResponse>>(
      "/safe-zone-manager/zones",
      { params: { nameFilter, page, size } }
    );
    return response.data;
  },

  updateSafeZone: async (
    zoneId: string,
    data: CreateSafeZoneRequest
  ): Promise<SafeZoneResponse> => {
    const response = await api.put<SafeZoneResponse>(
      `/safe-zone-manager/zones/${zoneId}`,
      data
    );
    return response.data;
  },

  deleteSafeZone: async (zoneId: string): Promise<void> => {
    await api.delete(`/safe-zone-manager/zones/${zoneId}`);
  },

  getNearestSafeZones: async (
    longitude: number,
    latitude: number,
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<SafeZoneResponse>> => {
    const response = await api.get<PageResponse<SafeZoneResponse>>(
      "/safe-zone-locator/zones/nearest",
      { params: { longitude, latitude, page, size } }
    );
    return response.data;
  },

  updateEmergencyServiceLocation: async (
    longitude: number,
    latitude: number
  ): Promise<EmergencyServiceLocationResponse> => {
    const response = await api.patch<EmergencyServiceLocationResponse>(
      "/emergency-request-manager/location",
      { longitude, latitude }
    );
    return response.data;
  },

  getEmergencyServiceLocation: async (): Promise<EmergencyServiceLocationResponse> => {
    const response = await api.get<EmergencyServiceLocationResponse>(
      "/emergency-request-manager/location"
    );
    return response.data;
  },

  getEmergencyServiceTargets: async (
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<EmergencyServiceTargetsResponse>> => {
    const response = await api.get<PageResponse<EmergencyServiceTargetsResponse>>(
      "/emergency-responder/targets",
      { params: { page, size } }
    );
    return response.data;
  },
};
