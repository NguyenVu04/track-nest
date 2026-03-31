export const BACKGROUND_USER_LOCATION_TASK_NAME =
  "background-user-location-task";

export const BACKGROUND_CIRCLE_LOCATION_TASK_NAME =
  "background-circle-location-task";

export const BACKGROUND_LOCATION_UPLOAD_TASK_NAME =
  "background-location-upload-task";

export const LOCATION_STORAGE_KEY = "@tracknest/last_location";

export const LOCATION_UPLOAD_QUEUE_KEY = "@tracknest/location_upload_queue";

export const LOCATION_HISTORY_KEY = "@tracknest/location_history";

export const TRACKING_KEY = "@TrackNest:tracking";

export const SHARE_LOCATION_KEY = "@tracknest/share_location";

export const CORRECT_PIN = "1234";

export const LOCATION_UPDATE_EMIT_EVENT = "locationUpdated";

export const CRASH_DETECTION_CHANNEL_ID = "crash-detection";

export const LOCATION_UPLOAD_CHANNEL_ID = "location-upload";

// Minimum total g-force magnitude to treat as a crash/impact event.
// 1g = resting gravity. Values above this threshold indicate a sudden impact.
export const CRASH_DETECTION_THRESHOLD = 3.0;

// Minimum milliseconds between consecutive crash notifications (cooldown).
export const CRASH_NOTIFICATION_COOLDOWN_MS = 15_000;
