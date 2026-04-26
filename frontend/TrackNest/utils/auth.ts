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

/**
 * Decodes the JWT access token and returns the Keycloak user UUID (sub claim).
 * Throws AuthUnavailableError if no valid token is found.
 */
export const getUserId = async (): Promise<string> => {
  const tokensJson = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  if (!tokensJson) {
    throw new AuthUnavailableError("No authentication token found.");
  }

  const tokens: StoredTokens = JSON.parse(tokensJson);

  if (isTokenExpired(tokens)) {
    throw new AuthUnavailableError("Authentication token expired.");
  }

  // JWT is base64url encoded — decode the payload (second segment)
  const parts = tokens.accessToken.split(".");
  if (parts.length !== 3) {
    throw new AuthUnavailableError("Malformed access token.");
  }

  const payload = JSON.parse(
    atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
  );

  if (!payload.sub) {
    throw new AuthUnavailableError("Access token missing sub claim.");
  }

  return payload.sub as string;
};
