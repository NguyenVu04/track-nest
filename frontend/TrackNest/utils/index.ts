import { BACKGROUND_USER_LOCATION_TASK_NAME } from "@/constant";
import { StoredTokens } from "@/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

export const formatRelativeTime = (lastActive?: string | number | Date) => {
  if (!lastActive) return "";
  const d = new Date(lastActive);
  if (isNaN(d.getTime())) return String(lastActive);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 10) return "just now";
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString();
};

export const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export const formatAddressFromLatLng = async (
  lat: number,
  lng: number,
): Promise<string> => {
  if (!lat || !lng) return "";

  try {
    const { reverseGeocodeAsync } = await import("expo-location");
    const results = await reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });

    if (results.length === 0) return "";

    const address = results[0].formattedAddress;

    return address || "";
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return "";
  }
};

export const getBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return "http://127.0.0.1";

  const ip = hostUri.split(":")[0];
  return `http://${ip}`;
};

const TOKEN_STORAGE_KEY = "@TrackNest:tokens";

/**
 * Retrieves the access token from device storage.
 * Returns the authorization metadata object for gRPC calls.
 */
export const getAuthMetadata = async (): Promise<{ Authorization: string }> => {
  const tokensJson = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  if (!tokensJson) {
    throw new Error("No authentication token found. Please log in.");
  }
  const tokens: StoredTokens = JSON.parse(tokensJson);
  return {
    Authorization: `Bearer ${tokens.accessToken}`,
  };
};

export async function requestPermissionsAndStart() {
  const { status: fgStatus } =
    await Location.requestForegroundPermissionsAsync();

  if (fgStatus !== "granted") {
    return;
  }

  const { status: bgStatus } =
    await Location.requestBackgroundPermissionsAsync();

  if (bgStatus !== "granted") {
    return;
  }

  await Location.startLocationUpdatesAsync(BACKGROUND_USER_LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.BestForNavigation,
    mayShowUserSettingsDialog: true,
    // Foreground service notification shown while tracking in background
    foregroundService: {
      notificationTitle: "TrackNest is tracking your location",
      notificationBody: "",
      notificationColor: "#74becb",
      killServiceOnDestroy: false,
    },
    timeInterval: 60000, // milliseconds
    distanceInterval: 300, // meters
  });
}

export async function stopBackgroundLocationTracking() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_USER_LOCATION_TASK_NAME,
  );
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_USER_LOCATION_TASK_NAME);

    console.log("Background location tracking stopped.");
  }
}

// Load saved location from storage
export const loadSavedKey = async <T>(key: string): Promise<T | null> => {
  try {
    const saved = await AsyncStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    /* ignore */
  }
  return null;
};

// Save location to storage
export const saveKey = async <T>(key: string, value: T): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};
