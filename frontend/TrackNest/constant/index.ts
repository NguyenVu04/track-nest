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

// Lower g-force threshold used specifically when in driving mode (more sensitive).
export const DRIVING_CRASH_THRESHOLD = 2.5;

// React Native event emitted by NativeLocationModule when tracking mode changes.
export const TRACKING_MODE_CHANGED_EVENT = "trackingModeChanged";

// React Native event emitted from AppHeader to open general information sheet.
export const OPEN_GENERAL_INFO_SHEET_EVENT = "openGeneralInfoSheet";

// Family chat — notification channel
export const CHAT_NOTIFICATION_CHANNEL_ID = "family-chat";

// Family chat — AsyncStorage key for persisted unread count
export const CHAT_UNREAD_KEY = "@tracknest/chat_unread_count";

// Background FCM data-message handler task name
export const BACKGROUND_NOTIFICATION_TASK_NAME = "background-notification-task";

// Family chat — DeviceEventEmitter events
export const CHAT_NEW_MESSAGE_EVENT = "chatNewMessage";
export const CHAT_BADGE_CHANGED_EVENT = "chatBadgeChanged";
export const CHAT_FOCUS_EVENT = "chatFocusChanged";
export const CHAT_CIRCLE_CHANGED_EVENT = "chatCircleChanged";

export type TrackingMode = "NORMAL" | "NAVIGATION";
