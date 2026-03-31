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
};

export type LocationState = {
  latitude: number;
  longitude: number;
  speed: number | null;
  timestamp?: number;
  time_spent?: number;
};

export type SafeZone = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

export type DangerStatus = "low" | "medium" | "high" | "critical";

export type CrimeReport = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  numberOfCriminals: number;
  dangerStatus: DangerStatus;
  incidentType: string;
  reportedAt: string;
  note?: string;
};
