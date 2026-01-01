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
