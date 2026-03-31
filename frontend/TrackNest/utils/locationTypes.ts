export type StoredLocationEntry = {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  timestamp: number;
  time_spent?: number;
};

export type StoredLatestLocation = {
  latitude: number;
  longitude: number;
  speed: number | null;
  timestamp?: number;
  time_spent?: number;
};
