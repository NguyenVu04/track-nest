import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

export const SERVICE_URL_KEY = "@tracknest/service_url";
export const EMERGENCY_URL_KEY = "@tracknest/emergency_url";
export const CRIMINAL_URL_KEY = "@tracknest/criminal_url";
export const GRPC_URL_KEY = "@tracknest/grpc_url";
export const USER_TRACKING_HTTP_URL_KEY = "@tracknest/user_tracking_http_url";

const getDevHostUrl = (): string | null => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;

  const ip = hostUri.split(":")[0];
  return ip ? `http://${ip}` : null;
};

const getStoredUrl = async (key: string): Promise<string | null> => {
  try {
    const stored = await AsyncStorage.getItem(key);
    const trimmed = stored?.trim();
    return trimmed ? trimmed : null;
  } catch {
    return null;
  }
};

/**
 * Returns the service URL, preferring the user-saved override from AsyncStorage
 * over the EXPO_PUBLIC_SERVICE_URL environment variable. If both are missing,
 * falls back to the Expo dev host URL when available.
 */
export const getServiceUrl = async (): Promise<string> => {
  const stored = await getStoredUrl(SERVICE_URL_KEY);
  if (stored) return stored;

  const envUrl = process.env.EXPO_PUBLIC_SERVICE_URL?.trim();
  if (envUrl) return envUrl;

  return getDevHostUrl() ?? "";
};

export const getBaseUrl = async () => getServiceUrl();

/**
 * Returns the emergency service URL, preferring user override,
 * then EXPO_PUBLIC_EMERGENCY_URL, and finally falling back to service URL.
 */
export const getEmergencyUrl = async (): Promise<string> => {
  const stored = await getStoredUrl(EMERGENCY_URL_KEY);
  if (stored) return stored;

  const envUrl = process.env.EXPO_PUBLIC_EMERGENCY_URL?.trim();
  if (envUrl) return envUrl;

  return getServiceUrl();
};

/**
 * Returns the criminal reports service URL, preferring user override,
 * then EXPO_PUBLIC_CRIMINAL_URL, and finally falling back to service URL.
 */
export const getCriminalUrl = async (): Promise<string> => {
  const stored = await getStoredUrl(CRIMINAL_URL_KEY);
  if (stored) return stored;

  const envUrl = process.env.EXPO_PUBLIC_CRIMINAL_URL?.trim();
  if (envUrl) return envUrl;

  return getServiceUrl();
};

/**
 * Returns the user-tracking HTTP base URL (port 18080, context /user-tracking).
 * Used only by dev/test tooling — the mobile app otherwise talks to user-tracking
 * exclusively over gRPC.
 */
export const getUserTrackingHttpUrl = async (): Promise<string> => {
  const stored = await getStoredUrl(USER_TRACKING_HTTP_URL_KEY);
  if (stored) return stored;

  const envUrl = process.env.EXPO_PUBLIC_USER_TRACKING_HTTP_URL?.trim();
  if (envUrl) return envUrl;

  const devHost = getDevHostUrl();
  return devHost ? `${devHost}:18080/user-tracking` : "http://localhost:18080/user-tracking";
};

/**
 * Returns the full gRPC endpoint URL used by all gRPC services.
 * Priority: manual dev-mode override (stored value is used as-is) →
 * derived from base URL using the default port/path convention.
 * Use the dev modal to set this when the server's gRPC path differs
 * from the default (e.g. production no longer uses the /grpc prefix).
 */
export const getGrpcUrl = async (): Promise<string> => {
  const stored = await getStoredUrl(GRPC_URL_KEY);
  if (stored) return stored;

  const baseUrl = await getServiceUrl();
  return `${baseUrl}${__DEV__ ? ":8800" : ":443"}`;
};
