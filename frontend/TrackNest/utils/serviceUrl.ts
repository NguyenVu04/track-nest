import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

export const SERVICE_URL_KEY = "@tracknest/service_url";

export const getBaseUrl = async () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) {
    const url = await getServiceUrl();
    return url;
  }

  const ip = hostUri.split(":")[0];
  return `http://${ip}`;
};

/**
 * Returns the service URL, preferring the user-saved override from AsyncStorage
 * over the EXPO_PUBLIC_SERVICE_URL environment variable.
 */
export const getServiceUrl = async (): Promise<string> => {
  try {
    const stored = await AsyncStorage.getItem(SERVICE_URL_KEY);
    if (stored) return stored;
  } catch {
    /* ignore */
  }
  return process.env.EXPO_PUBLIC_SERVICE_URL ?? "";
};

/**
 * Returns the emergency service URL.
 * In dev (expo dev server detected), falls back to local IP.
 * In production, uses EXPO_PUBLIC_EMERGENCY_URL.
 */
export const getEmergencyUrl = async (): Promise<string> => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    return `http://${ip}`;
  }
  return process.env.EXPO_PUBLIC_EMERGENCY_URL ?? (await getServiceUrl());
};

/**
 * Returns the criminal reports service URL.
 * In dev (expo dev server detected), falls back to local IP.
 * In production, uses EXPO_PUBLIC_CRIMINAL_URL.
 */
export const getCriminalUrl = async (): Promise<string> => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    return `http://${ip}`;
  }
  return process.env.EXPO_PUBLIC_CRIMINAL_URL ?? (await getServiceUrl());
};
