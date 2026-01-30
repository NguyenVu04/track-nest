export type Follower = {
  id: string;
  latitude: number;
  longitude: number;
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
