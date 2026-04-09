import axios from "axios";
import { authService } from "./authService";

const API_URL =
  process.env.NEXT_PUBLIC_USER_TRACKING_API_URL || "http://localhost:38080";

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

export interface FamilyCircle {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface FamilyCircleMember {
  userId: string;
  username: string;
  role: string;
  admin: boolean;
}

export interface Location {
  longitude: number;
  latitude: number;
  timestamp: string;
}

export interface TrackingNotification {
  id: string;
  type: "LOCATION_UPDATE" | "GEOFENCE_ALERT" | "EMERGENCY";
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface RiskNotification {
  id: string;
  type: "HIGH_RISK_ZONE" | "ANOMALY_DETECTED";
  title: string;
  content: string;
  latitude: number;
  longitude: number;
  severity: number;
  read: boolean;
  createdAt: string;
}

export interface MobileDevice {
  id: string;
  deviceToken: string;
  platform: "ANDROID" | "IOS";
  languageCode: string;
  enabled: boolean;
  lastActiveAt: string;
}

export interface CreateFamilyCircleRequest {
  name: string;
}

export interface UpdateFamilyCircleRequest {
  name: string;
}

export interface CreateParticipationPermissionRequest {
  familyCircleId: string;
  expiresAt?: string;
}

export interface RegisterMobileDeviceRequest {
  deviceToken: string;
  platform: "ANDROID" | "IOS";
  languageCode: string;
}

export interface UpdateMobileDeviceRequest {
  deviceId: string;
  enabled: boolean;
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export const userTrackingService = {
  familyCircle: {
    create: async (data: CreateFamilyCircleRequest): Promise<FamilyCircle> => {
      const response = await api.post<FamilyCircle>(
        "/tracking-manager/family-circles",
        data,
      );
      return response.data;
    },

    list: async (
      page: number = 0,
      size: number = 10,
    ): Promise<PageResponse<FamilyCircle>> => {
      const response = await api.get<PageResponse<FamilyCircle>>(
        "/tracking-manager/family-circles",
        { params: { page, size } },
      );
      return response.data;
    },

    get: async (circleId: string): Promise<FamilyCircle> => {
      const response = await api.get<FamilyCircle>(
        `/tracking-manager/family-circles/${circleId}`,
      );
      return response.data;
    },

    update: async (
      circleId: string,
      data: UpdateFamilyCircleRequest,
    ): Promise<FamilyCircle> => {
      const response = await api.put<FamilyCircle>(
        `/tracking-manager/family-circles/${circleId}`,
        data,
      );
      return response.data;
    },

    delete: async (circleId: string): Promise<void> => {
      await api.delete(`/tracking-manager/family-circles/${circleId}`);
    },

    listMembers: async (
      circleId: string,
      page: number = 0,
      size: number = 10,
    ): Promise<PageResponse<FamilyCircleMember>> => {
      const response = await api.get<PageResponse<FamilyCircleMember>>(
        `/tracking-manager/family-circles/${circleId}/members`,
        { params: { page, size } },
      );
      return response.data;
    },

    addMember: async (
      circleId: string,
      userId: string,
    ): Promise<FamilyCircleMember> => {
      const response = await api.post<FamilyCircleMember>(
        `/tracking-manager/family-circles/${circleId}/members`,
        { userId },
      );
      return response.data;
    },

    removeMember: async (circleId: string, memberId: string): Promise<void> => {
      await api.delete(
        `/tracking-manager/family-circles/${circleId}/members/${memberId}`,
      );
    },

    updateMemberRole: async (
      circleId: string,
      memberId: string,
      role: "MEMBER" | "ADMIN",
    ): Promise<FamilyCircleMember> => {
      const response = await api.patch<FamilyCircleMember>(
        `/tracking-manager/family-circles/${circleId}/members/${memberId}/role`,
        { role },
      );
      return response.data;
    },

    requestJoin: async (circleId: string): Promise<void> => {
      await api.post(`/tracking-manager/family-circles/${circleId}/join`);
    },

    leave: async (circleId: string): Promise<void> => {
      await api.post(`/tracking-manager/family-circles/${circleId}/leave`);
    },

    createPermission: async (
      data: CreateParticipationPermissionRequest,
    ): Promise<{ permissionId: string; code: string }> => {
      const response = await api.post<{ permissionId: string; code: string }>(
        "/tracking-manager/permissions",
        data,
      );
      return response.data;
    },

    joinWithCode: async (code: string): Promise<FamilyCircle> => {
      const response = await api.post<FamilyCircle>(
        "/tracking-manager/permissions/join",
        { code },
      );
      return response.data;
    },
  },

  tracking: {
    enable: async (): Promise<void> => {
      await api.post("/tracking-manager/tracking/enable");
    },

    disable: async (): Promise<void> => {
      await api.post("/tracking-manager/tracking/disable");
    },

    getStatus: async (): Promise<{ enabled: boolean }> => {
      const response = await api.get<{ enabled: boolean }>(
        "/tracking-manager/tracking/status",
      );
      return response.data;
    },

    getCurrentLocation: async (): Promise<Location> => {
      const response = await api.get<Location>(
        "/tracking-manager/location/current",
      );
      return response.data;
    },

    getTargetLocation: async (targetId: string): Promise<Location> => {
      const response = await api.get<Location>(
        `/tracking-manager/location/target/${targetId}`,
      );
      return response.data;
    },

    getLocationHistory: async (
      targetId: string,
      startTime: string,
      endTime: string,
    ): Promise<Location[]> => {
      const response = await api.get<Location[]>(
        `/tracking-manager/location/history/${targetId}`,
        { params: { startTime, endTime } },
      );
      return response.data;
    },
  },

  notifications: {
    listTracking: async (
      page: number = 0,
      size: number = 10,
    ): Promise<PageResponse<TrackingNotification>> => {
      const response = await api.get<PageResponse<TrackingNotification>>(
        "/notifier/tracking-notifications",
        { params: { page, size } },
      );
      return response.data;
    },

    listRisk: async (
      page: number = 0,
      size: number = 10,
    ): Promise<PageResponse<RiskNotification>> => {
      const response = await api.get<PageResponse<RiskNotification>>(
        "/notifier/risk-notifications",
        { params: { page, size } },
      );
      return response.data;
    },

    deleteTrackingNotification: async (
      notificationId: string,
    ): Promise<void> => {
      await api.delete(`/notifier/tracking-notifications/${notificationId}`);
    },

    deleteRiskNotification: async (notificationId: string): Promise<void> => {
      await api.delete(`/notifier/risk-notifications/${notificationId}`);
    },

    clearTracking: async (): Promise<void> => {
      await api.delete("/notifier/tracking-notifications");
    },

    clearRisk: async (): Promise<void> => {
      await api.delete("/notifier/risk-notifications");
    },

    countTracking: async (): Promise<{ count: number }> => {
      const response = await api.get<{ count: number }>(
        "/notifier/tracking-notifications/count",
      );
      return response.data;
    },

    countRisk: async (): Promise<{ count: number }> => {
      const response = await api.get<{ count: number }>(
        "/notifier/risk-notifications/count",
      );
      return response.data;
    },
  },

  mobileDevice: {
    register: async (
      data: RegisterMobileDeviceRequest,
    ): Promise<MobileDevice> => {
      const response = await api.post<MobileDevice>("/notifier/devices", data);
      return response.data;
    },

    unregister: async (deviceId: string): Promise<void> => {
      await api.delete(`/notifier/devices/${deviceId}`);
    },

    update: async (data: UpdateMobileDeviceRequest): Promise<MobileDevice> => {
      const response = await api.patch<MobileDevice>(
        `/notifier/devices/${data.deviceId}`,
        { enabled: data.enabled },
      );
      return response.data;
    },

    list: async (): Promise<MobileDevice[]> => {
      const response = await api.get<MobileDevice[]>("/notifier/devices");
      return response.data;
    },
  },
};
