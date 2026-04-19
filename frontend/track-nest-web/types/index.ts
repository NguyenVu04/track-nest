export type UserRole = "Admin" | "Reporter" | "Emergency Services" | "User";

export interface User {
  id: string;
  username: string;
  password?: string;
  email: string;
  role: UserRole;
  fullName: string;
  status?: "Active" | "Banned";
  createdAt?: string;
  keycloakId?: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: "create" | "edit" | "delete" | "publish" | "ban" | "unban";
  targetType:
    | "missing-person"
    | "crime-report"
    | "guideline"
    | "emergency-request"
    | "account"
    | "safe-zone";
  targetId: string;
  targetName: string;
  timestamp: string;
  details?: string;
}

export type MissingPersonStatus = "PENDING" | "PUBLISHED" | "REJECTED";

export interface MissingPerson {
  id: string;
  title: string;
  fullName: string;
  personalId: string;
  photo?: string;
  date: string;
  content: string;
  latitude?: number;
  longitude?: number;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  userId: string;
  status: MissingPersonStatus;
  reporterId: string;
  isPublic: boolean;
}

export type CrimeSeverity = 1 | 2 | 3 | 4 | 5;

export interface CrimeReport {
  id: string;
  title: string;
  content: string;
  severity: CrimeSeverity;
  date: string;
  longitude: number;
  latitude: number;
  numberOfVictims: number;
  numberOfOffenders: number;
  arrested: boolean;
  photos?: string[];
  createdAt: string;
  updatedAt: string;
  reporterId: string;
  isPublic: boolean;
}

export interface Guideline {
  id: string;
  title: string;
  abstractText: string;
  content: string;
  createdAt: string;
  reporterId: string;
  isPublic: boolean;
}

export type EmergencyRequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "COMPLETED";

export interface EmergencyRequest {
  id: string;
  openAt: string;
  closeAt?: string;
  senderId: string;
  targetId: string;
  emergencyServiceId: string;
  status: EmergencyRequestStatus;
  longitude: number;
  latitude: number;
}

export type SafeZoneType = "Police Station" | "Hospital" | "Shelter" | "Other";

export interface SafeZone {
  id: string;
  name: string;
  type?: SafeZoneType;
  address?: string;
  longitude: number;
  latitude: number;
  radius: number;
  createdAt: string;
  emergencyServiceId?: string;
}

export interface EmergencyService {
  id: string;
  username: string;
  phoneNumber: string;
  longitude?: number;
  latitude?: number;
  updatedAt: string;
}

export interface Location {
  longitude: number;
  latitude: number;
  timestamp: string;
}

export interface PageInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ApiResponse<T> {
  content: T[];
  pageInfo: PageInfo;
}

export type FamilyCircleRole = "OWNER" | "ADMIN" | "MEMBER";

export interface FamilyCircle {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface FamilyCircleMember {
  id: string;
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: FamilyCircleRole;
  joinedAt: string;
}

export type TrackingNotificationType =
  | "LOCATION_UPDATE"
  | "GEOFENCE_ALERT"
  | "EMERGENCY";
export type RiskNotificationType = "HIGH_RISK_ZONE" | "ANOMALY_DETECTED";

export interface TrackingNotification {
  id: string;
  type: TrackingNotificationType;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface RiskNotification {
  id: string;
  type: RiskNotificationType;
  title: string;
  content: string;
  latitude: number;
  longitude: number;
  severity: number;
  read: boolean;
  createdAt: string;
}

export type MobilePlatform = "ANDROID" | "IOS";

export interface MobileDevice {
  id: string;
  deviceToken: string;
  platform: MobilePlatform;
  languageCode: string;
  enabled: boolean;
  lastActiveAt: string;
}
