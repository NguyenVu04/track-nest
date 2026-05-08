export type ActivityMode = "walking" | "driving" | "charging" | "stationary";

export type Follower = {
  id: string;
  latitude: number;
  longitude: number;
  familyCircleId?: string;
  avatar?: string;
  name: string;
  lastActive?: string | number;
  sharingActive?: boolean;
  shareTracking?: boolean;
  batteryLevel?: number;
  activityMode?: ActivityMode;
  currentAddress?: string;
};

export type ProtoTrackerResponse = {
  id: string;
  userId: string;
  username: string;
  online: boolean;
  lastActive: number; //seconds since epoch
};

export type FamilyCircle = {
  familyCircleId: string;
  name: string;
  createdAtMs: number;
  memberCount?: number;
  role?: string;
  isAdmin?: boolean;
};

export type LocationState = {
  latitude: number;
  longitude: number;
  speed: number | null;
  accuracy?: number | null;
  timestamp?: number;
  time_spent?: number;
};

export type SafeZone = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  createdAt: string;
  emergencyServiceId?: string;
};

export type DangerStatus = "low" | "medium" | "high" | "critical";

export type CrimeReport = {
  id: string;
  title: string;
  content: string;
  severity: number;
  date: string;
  latitude: number;
  longitude: number;
  numberOfVictims: number;
  numberOfOffenders: number;
  arrested: boolean;
  createdAt: string;
  reporterId: string;
  isPublic: boolean;
};
