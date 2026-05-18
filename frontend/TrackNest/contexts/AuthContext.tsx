import {
  BACKGROUND_LOCATION_UPLOAD_TASK_NAME,
  BACKGROUND_USER_LOCATION_TASK_NAME,
} from "@/constant";
import {
  getBaseUrl,
  getGrpcUrl,
  stopBackgroundLocationTracking,
  unregisterBackgroundTaskAsync,
} from "@/utils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules, Platform } from "react-native";
import { makeRedirectUri, refreshAsync } from "expo-auth-session";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// Storage keys for tokens
const TOKEN_STORAGE_KEY = "@TrackNest:tokens";
const GUEST_MODE_STORAGE_KEY = "@TrackNest:guest_mode";

// Keycloak configuration
export const serviceUrl = process.env.EXPO_PUBLIC_SERVICE_URL;
export const realmName = process.env.EXPO_PUBLIC_KEYCLOAK_REALM;
export const clientId = process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID || "mobile";

export const getKeycloakDiscovery = async () => {
  const base = await getBaseUrl();
  return {
    authorizationEndpoint: `${base}/auth/realms/${realmName}/protocol/openid-connect/auth`,
    tokenEndpoint: `${base}/auth/realms/${realmName}/protocol/openid-connect/token`,
    revocationEndpoint: `${base}/auth/realms/${realmName}/protocol/openid-connect/revoke`,
  };
};

// Token storage interface
export interface StoredTokens {
  accessToken: string;
  refreshToken: string | null;
  idToken: string | null;
  expiresAt: number; // Unix timestamp when token expires
}

export interface AuthUser {
  sub?: string;
  username?: string;
  name?: string;
  email?: string;
  emailVerified?: boolean;
  raw?: Record<string, unknown>;
}

interface AuthContextType {
  tokens: StoredTokens | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isGuestMode: boolean;
  canUseApp: boolean;
  isLoading: boolean;
  saveTokens: (tokens: StoredTokens) => Promise<void>;
  clearTokens: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  disableGuestMode: () => Promise<void>;
  getValidAccessToken: () => Promise<string | null>;
  refreshTokens: () => Promise<StoredTokens | null>;
  logout: (options?: { skipKeycloak?: boolean }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [tokens, setTokens] = useState<StoredTokens | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const lastBootstrappedAccessTokenRef = useRef<string | null>(null);

  // Check if token is expired (with 60-second buffer)
  const isTokenExpired = useCallback((storedTokens: StoredTokens): boolean => {
    return Date.now() >= storedTokens.expiresAt - 60000;
  }, []);

  const decodeJwtClaims = useCallback((token?: string | null) => {
    if (!token) return null;
    try {
      const payload = token.split(".")[1];
      if (!payload) return null;
      const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padLength = (4 - (normalized.length % 4)) % 4;
      const padded = normalized.padEnd(normalized.length + padLength, "=");
      const json = decodeURIComponent(
        atob(padded)
          .split("")
          .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join(""),
      );
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      return null;
    }
  }, []);

  const mapClaimsToUser = useCallback(
    (claims: Record<string, unknown> | null): AuthUser | null => {
      if (!claims) return null;
      return {
        sub: (claims.sub as string | undefined) ?? undefined,
        username:
          (claims.preferred_username as string | undefined) ??
          (claims.username as string | undefined) ??
          undefined,
        name:
          (claims.name as string | undefined) ??
          (claims.given_name as string | undefined) ??
          undefined,
        email: (claims.email as string | undefined) ?? undefined,
        emailVerified:
          (claims.email_verified as boolean | undefined) ?? undefined,
        raw: claims,
      };
    },
    [],
  );

  const resolveUserInfo = useCallback(
    async (activeTokens: StoredTokens): Promise<AuthUser | null> => {
      try {
        const base = await getBaseUrl();
        const response = await fetch(
          `${base}/auth/realms/${realmName}/protocol/openid-connect/userinfo`,
          {
            headers: {
              Authorization: `Bearer ${activeTokens.accessToken}`,
            },
          },
        );

        if (response.ok) {
          const userInfo = (await response.json()) as Record<string, unknown>;
          return mapClaimsToUser(userInfo);
        }
      } catch (error) {
        console.warn("Failed to fetch userinfo endpoint:", error);
      }

      return (
        mapClaimsToUser(decodeJwtClaims(activeTokens.idToken)) ??
        mapClaimsToUser(decodeJwtClaims(activeTokens.accessToken))
      );
    },
    [decodeJwtClaims, mapClaimsToUser],
  );

  // Load tokens from storage on mount
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const [tokensJson, guestModeRaw] = await Promise.all([
          AsyncStorage.getItem(TOKEN_STORAGE_KEY),
          AsyncStorage.getItem(GUEST_MODE_STORAGE_KEY),
        ]);

        if (tokensJson) {
          const storedTokens: StoredTokens = JSON.parse(tokensJson);
          setTokens(storedTokens);

          // Re-sync JWT to native SharedPreferences on every boot so the
          // Kotlin foreground service has a valid token even after an app restart.
          if (Platform.OS === "android") {
            NativeModules.NativeLocationModule?.setAuthToken?.(
              storedTokens.accessToken,
            );
          }
        }

        setIsGuestMode(guestModeRaw === "true");

        // Push gRPC base URL to native SharedPreferences so LocationUploadClient
        // uses the correct Envoy endpoint (respects .env and dev-mode overrides).
        if (Platform.OS === "android") {
          const grpcUrl = await getGrpcUrl();
          NativeModules.NativeLocationModule?.setGrpcUrl?.(grpcUrl);
        }
      } catch (error) {
        console.error("Failed to load tokens:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTokens();
  }, []);

  // Save tokens to storage and state
  const saveTokensHandler = useCallback(
    async (newTokens: StoredTokens): Promise<void> => {
      try {
        await Promise.all([
          AsyncStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(newTokens)),
          AsyncStorage.removeItem(GUEST_MODE_STORAGE_KEY),
        ]);
        setTokens(newTokens);
        setIsGuestMode(false);

        // Sync JWT to native SharedPreferences so LocationUploadClient
        // (Kotlin foreground service) can upload without the React bridge.
        if (Platform.OS === "android") {
          NativeModules.NativeLocationModule?.setAuthToken?.(newTokens.accessToken);
        }
      } catch (error) {
        console.error("Failed to save tokens:", error);
        throw error;
      }
    },
    [],
  );

  // Clear tokens from storage and state
  const clearTokensHandler = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      setTokens(null);
      setUser(null);
    } catch (error) {
      console.error("Failed to clear tokens:", error);
    }
  }, []);

  const continueAsGuestHandler = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(GUEST_MODE_STORAGE_KEY, "true");
      setIsGuestMode(true);
    } catch (error) {
      console.error("Failed to enable guest mode:", error);
      throw error;
    }
  }, []);

  const disableGuestModeHandler = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(GUEST_MODE_STORAGE_KEY);
      setIsGuestMode(false);
    } catch (error) {
      console.error("Failed to disable guest mode:", error);
      throw error;
    }
  }, []);

  // Full logout with optional Keycloak session termination
  const logoutHandler = useCallback(
    async (options?: { skipKeycloak?: boolean }): Promise<void> => {
      try {
        const idToken = tokens?.idToken;

        // If we have an idToken and should not skip Keycloak logout, do full OIDC logout
        if (idToken && !options?.skipKeycloak) {
          const redirectUri = makeRedirectUri({
            scheme: "tracknest",
            path: "auth/login",
          });
          const base = await getBaseUrl();
          const logoutUrl = `${base}/auth/realms/${realmName}/protocol/openid-connect/logout?id_token_hint=${idToken}&post_logout_redirect_uri=${encodeURIComponent(redirectUri)}`;

          await WebBrowser.openAuthSessionAsync(logoutUrl, redirectUri);
        }

        // Clear tokens — useRequireAuth will handle redirecting to /auth/login
        // once the state update propagates, avoiding a race condition where the
        // login screen sees stale isAuthenticated=true and redirects back to /map.
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
        setTokens(null);
        setUser(null);

        // Stop background location and upload tasks so they don't persist
        // after the user has signed out.
        await stopBackgroundLocationTracking().catch(() => {});
        await unregisterBackgroundTaskAsync(
          BACKGROUND_USER_LOCATION_TASK_NAME,
        ).catch(() => {});
        await unregisterBackgroundTaskAsync(
          BACKGROUND_LOCATION_UPLOAD_TASK_NAME,
        ).catch(() => {});
      } catch (error) {
        console.error("Logout error:", error);
        // Even if Keycloak logout fails, clear local tokens
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
        setTokens(null);
        setUser(null);
        await stopBackgroundLocationTracking().catch(() => {});
        await unregisterBackgroundTaskAsync(
          BACKGROUND_USER_LOCATION_TASK_NAME,
        ).catch(() => {});
        await unregisterBackgroundTaskAsync(
          BACKGROUND_LOCATION_UPLOAD_TASK_NAME,
        ).catch(() => {});
      }
    },
    [tokens?.idToken],
  );

  // Refresh tokens using refresh token
  const refreshTokensHandler =
    useCallback(async (): Promise<StoredTokens | null> => {
      if (!tokens?.refreshToken) {
        return null;
      }

      try {
        const tokenResult = await refreshAsync(
          {
            clientId: clientId,
            refreshToken: tokens.refreshToken,
          },
          await getKeycloakDiscovery(),
        );

        const newTokens: StoredTokens = {
          accessToken: tokenResult.accessToken,
          refreshToken: tokenResult.refreshToken ?? null,
          idToken: tokenResult.idToken ?? null,
          expiresAt: Date.now() + (tokenResult.expiresIn ?? 300) * 1000,
        };

        await saveTokensHandler(newTokens);
        return newTokens;
      } catch (error) {
        console.error("Failed to refresh tokens:", error);
        await clearTokensHandler();
        return null;
      }
    }, [tokens?.refreshToken, saveTokensHandler, clearTokensHandler]);

  useEffect(() => {
    if (isLoading) return;

    if (!tokens) {
      setUser(null);
      lastBootstrappedAccessTokenRef.current = null;
      return;
    }

    if (lastBootstrappedAccessTokenRef.current === tokens.accessToken) {
      return;
    }

    lastBootstrappedAccessTokenRef.current = tokens.accessToken;

    let cancelled = false;

    const bootstrapAuthState = async () => {
      try {
        const activeTokens = isTokenExpired(tokens)
          ? await refreshTokensHandler()
          : tokens;

        if (!activeTokens) {
          if (!cancelled) {
            setUser(null);
          }
          return;
        }

        const resolvedUser = await resolveUserInfo(activeTokens);
        if (!cancelled) {
          setUser(resolvedUser);
        }
      } catch (error) {
        console.error("Failed to bootstrap auth state:", error);
        if (!cancelled) {
          setUser(null);
        }
      }
    };

    bootstrapAuthState();

    return () => {
      cancelled = true;
    };
  }, [
    isLoading,
    tokens,
    isTokenExpired,
    refreshTokensHandler,
    resolveUserInfo,
  ]);

  // Get a valid access token, refreshing if necessary
  const getValidAccessToken = useCallback(async (): Promise<string | null> => {
    if (!tokens) {
      return null;
    }

    if (!isTokenExpired(tokens)) {
      return tokens.accessToken;
    }

    // Token expired, try to refresh
    const newTokens = await refreshTokensHandler();
    if (newTokens) {
      return newTokens.accessToken;
    }

    // Refresh failed, logout will handle redirect
    return null;
  }, [tokens, isTokenExpired, refreshTokensHandler]);

  const isAuthenticated = useMemo(() => {
    if (tokens === null) return false;
    // Access token still valid — definitely authenticated.
    if (!isTokenExpired(tokens)) return true;
    // Access token expired but refresh token exists — the bootstrap effect will
    // refresh silently; treat as authenticated so useRequireAuth doesn't redirect
    // before the refresh has a chance to complete.
    return tokens.refreshToken !== null;
  }, [tokens, isTokenExpired]);

  const canUseApp = useMemo(() => {
    return isAuthenticated || isGuestMode;
  }, [isAuthenticated, isGuestMode]);

  const value = useMemo(
    () => ({
      tokens,
      user,
      isAuthenticated,
      isGuestMode,
      canUseApp,
      isLoading,
      saveTokens: saveTokensHandler,
      clearTokens: clearTokensHandler,
      continueAsGuest: continueAsGuestHandler,
      disableGuestMode: disableGuestModeHandler,
      getValidAccessToken,
      refreshTokens: refreshTokensHandler,
      logout: logoutHandler,
    }),
    [
      tokens,
      user,
      isAuthenticated,
      isGuestMode,
      canUseApp,
      isLoading,
      saveTokensHandler,
      clearTokensHandler,
      continueAsGuestHandler,
      disableGuestModeHandler,
      getValidAccessToken,
      refreshTokensHandler,
      logoutHandler,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook for protected routes - redirects to login if not authenticated
 * Use this in screens that require authentication
 */
export function useRequireAuth(): AuthContextType & { isReady: boolean } {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until loading is complete before checking auth
    if (!auth.isLoading && !auth.isAuthenticated && !auth.isGuestMode) {
      router.replace("/auth/login");
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.isGuestMode, router]);

  return {
    ...auth,
    isReady: !auth.isLoading && (auth.isAuthenticated || auth.isGuestMode),
  };
}
