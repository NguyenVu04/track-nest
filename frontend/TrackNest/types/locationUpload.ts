export type LocationQueueEntry = {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  timestamp: number;
  time_spent?: number;
};

export type LocationUploadStatus =
  | "success"
  | "failed"
  | "no_network"
  | "auth_paused"
  | "empty";

export type LocationUploadResult = {
  status: LocationUploadStatus;
  uploaded: number;
  failed: number;
  reason?: string;
};
