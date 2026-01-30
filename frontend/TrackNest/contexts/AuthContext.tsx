import { getBaseUrl } from "@/utils";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  useState,
} from "react";

// Storage keys for tokens
const TOKEN_STORAGE_KEY = "@TrackNest:tokens";

const realmName = "public-dev";

// Keycloak configuration
const baseUrl = getBaseUrl();
export const keycloakDiscovery = {
  authorizationEndpoint: `${baseUrl}:80/auth/realms/${realmName}/protocol/openid-connect/auth`,
  tokenEndpoint: `${baseUrl}:80/auth/realms/${realmName}/protocol/openid-connect/token`,
  revocationEndpoint: `${baseUrl}:80/auth/realms/${realmName}/protocol/openid-connect/revoke`,
};

export const clientId = "mobile";

// Token storage interface
export interface StoredTokens {
  accessToken: string;
  refreshToken: string | null;
  idToken: string | null;
  expiresAt: number; // Unix timestamp when token expires
}

interface AuthContextType {
  tokens: StoredTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  saveTokens: (tokens: StoredTokens) => Promise<void>;
  clearTokens: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if token is expired (with 60-second buffer)
  const isTokenExpired = useCallback((storedTokens: StoredTokens): boolean => {
    return Date.now() >= storedTokens.expiresAt - 60000;
  }, []);

  // Load tokens from storage on mount
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const tokensJson = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (tokensJson) {
          const storedTokens: StoredTokens = JSON.parse(tokensJson);
          setTokens(storedTokens);
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
        await AsyncStorage.setItem(
          TOKEN_STORAGE_KEY,
          JSON.stringify(newTokens),
        );
        setTokens(newTokens);
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
    } catch (error) {
      console.error("Failed to clear tokens:", error);
    }
  }, []);

  // Full logout with optional Keycloak session termination
  const logoutHandler = useCallback(
    async (options?: { skipKeycloak?: boolean }): Promise<void> => {
      try {
        const idToken = tokens?.idToken;

        // If we have an idToken and should not skip Keycloak logout, do full OIDC logout
        if (idToken && !options?.skipKeycloak) {
          const redirectUri = makeRedirectUri({ scheme: "tracknest" });
          const logoutUrl = `${baseUrl}:80/auth/realms/${realmName}/protocol/openid-connect/logout?id_token_hint=${idToken}&post_logout_redirect_uri=${encodeURIComponent(redirectUri)}`;

          await WebBrowser.openAuthSessionAsync(logoutUrl, redirectUri);
        }

        // Clear tokens from storage and state
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
        setTokens(null);

        // Navigate to login
        router.replace("/login");
      } catch (error) {
        console.error("Logout error:", error);
        // Even if Keycloak logout fails, clear local tokens and redirect
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
        setTokens(null);
        router.replace("/login");
      }
    },
    [tokens?.idToken, router],
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
            clientId: "tracknest-mobile",
            refreshToken: tokens.refreshToken,
          },
          keycloakDiscovery,
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

  // Get a valid access token, refreshing if necessary
  const getValidAccessToken = useCallback(async (): Promise<string | null> => {
    if (!tokens) {
      // No tokens, redirect to login
      router.replace("/login");
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
  }, [tokens, isTokenExpired, refreshTokensHandler, router]);

  const isAuthenticated = useMemo(() => {
    return tokens !== null && !isTokenExpired(tokens);
  }, [tokens, isTokenExpired]);

  const value = useMemo(
    () => ({
      tokens,
      isAuthenticated,
      isLoading,
      saveTokens: saveTokensHandler,
      clearTokens: clearTokensHandler,
      getValidAccessToken,
      refreshTokens: refreshTokensHandler,
      logout: logoutHandler,
    }),
    [
      tokens,
      isAuthenticated,
      isLoading,
      saveTokensHandler,
      clearTokensHandler,
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
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.replace("/login");
    }
  }, [auth.isLoading, auth.isAuthenticated, router]);

  return {
    ...auth,
    isReady: !auth.isLoading && auth.isAuthenticated,
  };
}
