import { StoredTokens } from "@/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_STORAGE_KEY = "@TrackNest:tokens";

export class AuthUnavailableError extends Error {
  code = "AUTH_UNAVAILABLE" as const;

  constructor(message = "Authentication token unavailable") {
    super(message);
    this.name = "AuthUnavailableError";
  }
}

export const isAuthUnavailableError = (error: unknown): boolean => {
  return error instanceof AuthUnavailableError;
};

const isTokenExpired = (tokens: StoredTokens): boolean => {
  return Date.now() >= tokens.expiresAt - 60000;
};

/**
 * Retrieves the access token from device storage.
 * Returns the authorization metadata object for gRPC calls.
 */
export const getAuthMetadata = async (): Promise<{ Authorization: string }> => {
  const tokensJson = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  if (!tokensJson) {
    throw new AuthUnavailableError(
      "No authentication token found. Token-protected APIs are paused.",
    );
  }

  const tokens: StoredTokens = JSON.parse(tokensJson);

  if (isTokenExpired(tokens)) {
    throw new AuthUnavailableError(
      "Authentication token expired. Token-protected APIs are paused until login.",
    );
  }

  return {
    Authorization: `Bearer ${tokens.accessToken}`,
  };
};
