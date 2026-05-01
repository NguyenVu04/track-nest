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
  statusName: "PENDING" | "ACCEPTED" | "REJECTED" | "CLOSED";
  longitude: number;
  latitude: number;
}

export enum EmergencyStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  CLOSED = "CLOSED",
}

export interface SafeZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  createdAt: string;
  emergencyServiceId?: string;
}

export interface PostEmergencyRequestResponse {
  id: string;
  createdAtMs: number;
}

export interface AcceptEmergencyRequestResponse {
  id: string;
  acceptedAtMs: number;
}

export interface RejectEmergencyRequestResponse {
  id: string;
  rejectedAtMs: number;
}

export interface CloseEmergencyRequestResponse {
  id: string;
  closedAtMs: number;
}

export interface PostSafeZoneResponse {
  id: string;
  createdAtMs: number;
}

export interface PutSafeZoneResponse {
  id: string;
  updatedAtMs: number;
}

export interface DeleteSafeZoneResponse {
  id: string;
  deletedAtMs: number;
}

export interface PatchEmergencyServiceLocationResponse {
  id: string;
  updatedAtMs: number;
}

export interface CheckEmergencyRequestAllowedResponse {
  allowed: boolean;
  reason: string;
  checkedAtMs: number;
}

export interface PageResponse<T> {
  items: T[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface EmergencyServiceLocation {
  latitude: number | null;
  longitude: number | null;
  updatedAtMs: number | null;
}

export interface EmergencyResponderTarget {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  avatarUrl: string;
  lastLatitudeDegrees: number;
  lastLongitudeDegrees: number;
  lastUpdateTimeMs: number;
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
