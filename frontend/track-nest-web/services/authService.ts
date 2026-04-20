import Keycloak, { type KeycloakInitOptions } from "keycloak-js";

const KEYCLOAK_BASE_URL =
  process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost/auth";
const USER_REALM = process.env.NEXT_PUBLIC_USER_REALM || "restricted-dev";
const REPORTER_REALM =
  process.env.NEXT_PUBLIC_REPORTER_REALM || "restricted-dev";
const EMERGENCY_REALM =
  process.env.NEXT_PUBLIC_EMERGENCY_REALM || "restricted-dev";
const USER_CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "web";
const KEYCLOAK_FLOW =
  (process.env.NEXT_PUBLIC_KEYCLOAK_FLOW as
    | "standard"
    | "implicit"
    | "hybrid"
    | undefined) || "standard";

console.log("AuthService config:", {
  KEYCLOAK_BASE_URL,
  USER_REALM,
  REPORTER_REALM,
  EMERGENCY_REALM,
  USER_CLIENT_ID,
  KEYCLOAK_FLOW,
});

export interface LoginResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  id_token?: string;
  "not-before-policy"?: number;
  session_state?: string;
  scope: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export type UserRole = "user" | "reporter" | "emergency_services" | "admin";

export interface KeycloakUserInfo {
  sub: string;
  preferred_username: string;
  email?: string;
  name?: string;
  realm_access?: {
    roles: string[];
  };
}

let keycloakInstance: Keycloak | null = null;
let keycloakInitialized = false;
let keycloakInitPromise: Promise<boolean> | null = null;

const getKeycloak = (): Keycloak => {
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak({
      url: KEYCLOAK_BASE_URL,
      realm: USER_REALM,
      clientId: USER_CLIENT_ID,
    });
  }

  return keycloakInstance;
};

const mapTokenRole = (roles: string[] = []): UserRole => {
  if (roles.includes("admin")) {
    return "admin";
  }
  if (roles.includes("reporter")) {
    return "reporter";
  }
  if (roles.includes("emergency_services")) {
    return "emergency_services";
  }

  return "user";
};

const getRealm = (role: UserRole): string => {
  switch (role) {
    case "reporter":
      return REPORTER_REALM;
    case "emergency_services":
      return EMERGENCY_REALM;
    default:
      return USER_REALM;
  }
};

const persistKeycloakAuth = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  const keycloak = getKeycloak();
  const roles = keycloak.tokenParsed?.realm_access?.roles || [];
  const role = mapTokenRole(roles);

  if (keycloak.token) {
    localStorage.setItem("access_token", keycloak.token);
  }
  if (keycloak.refreshToken) {
    localStorage.setItem("refresh_token", keycloak.refreshToken);
  }
  if (keycloak.tokenParsed?.typ) {
    localStorage.setItem("token_type", keycloak.tokenParsed.typ);
  }
  localStorage.setItem("user_role", role);
  localStorage.setItem("user_realm", getRealm(role));
};

const clearStoredAuth = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("token_type");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_realm");
};

const buildTokenResponse = (): LoginResponse => {
  const keycloak = getKeycloak();

  return {
    access_token: keycloak.token || "",
    expires_in: 0,
    refresh_expires_in: 0,
    refresh_token: keycloak.refreshToken || "",
    token_type: keycloak.tokenParsed?.typ || "Bearer",
    id_token: keycloak.idToken,
    scope: "openid profile email",
  };
};

export const authService = {
  initKeycloak: async (
    options?: Partial<KeycloakInitOptions>,
  ): Promise<boolean> => {
    if (typeof window === "undefined") {
      return false;
    }

    const keycloak = getKeycloak();

    if (keycloakInitialized) {
      if (keycloak.authenticated) {
        persistKeycloakAuth();
      }
      return !!keycloak.authenticated;
    }

    if (!keycloakInitPromise) {
      const initOptions: KeycloakInitOptions = {
        onLoad: "check-sso",
        checkLoginIframe: false,
        flow: KEYCLOAK_FLOW,
        ...options,
      };

      if (KEYCLOAK_FLOW === "standard") {
        initOptions.pkceMethod = "S256";
      }

      keycloakInitPromise = keycloak.init(initOptions).then((authenticated) => {
        keycloakInitialized = true;

        if (authenticated) {
          persistKeycloakAuth();
        } else {
          clearStoredAuth();
        }

        keycloak.onTokenExpired = async () => {
          try {
            await keycloak.updateToken(30);
            persistKeycloakAuth();
          } catch (error) {
            console.error("Failed to refresh Keycloak token:", error);
            clearStoredAuth();
          }
        };

        return authenticated;
      });
    }

    return keycloakInitPromise;
  },

  loginWithKeycloak: async (redirectUri?: string): Promise<void> => {
    const keycloak = getKeycloak();

    if (!keycloakInitialized) {
      await authService.initKeycloak();
    }

    await keycloak.login({
      redirectUri:
        redirectUri ||
        (typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : undefined),
      scope: "openid profile email",
    });
  },

  exchangeCodeForToken: async (
    _code: string,
    _redirectUri: string,
  ): Promise<LoginResponse> => {
    void _code;
    void _redirectUri;

    await authService.initKeycloak();
    const keycloak = getKeycloak();

    if (!keycloak.authenticated) {
      throw new Error("Not authenticated with Keycloak");
    }

    persistKeycloakAuth();
    return buildTokenResponse();
  },

  login: async (
    _credentials: LoginCredentials,
    _role: UserRole = "user",
  ): Promise<LoginResponse> => {
    void _credentials;
    void _role;

    await authService.loginWithKeycloak();
    await authService.initKeycloak();

    const keycloak = getKeycloak();
    if (!keycloak.authenticated) {
      throw new Error("Not authenticated with Keycloak");
    }

    persistKeycloakAuth();
    return buildTokenResponse();
  },

  loginWithToken: async (
    accessToken?: string,
    role: UserRole = "user",
  ): Promise<KeycloakUserInfo> => {
    if (accessToken) {
      throw new Error(
        "Passing accessToken directly is not supported with keycloak-js",
      );
    }

    await authService.initKeycloak();
    const userInfo = await authService.getUserInfo(role);
    if (!userInfo) {
      throw new Error("No authenticated Keycloak session found");
    }

    return userInfo;
  },

  refreshToken: async (refreshToken?: string): Promise<LoginResponse> => {
    const keycloak = getKeycloak();

    await authService.initKeycloak();
    if (!keycloak.authenticated && !refreshToken) {
      throw new Error("No authenticated Keycloak session found");
    }

    await keycloak.updateToken(30);
    persistKeycloakAuth();
    return buildTokenResponse();
  },

  logout: async (): Promise<void> => {
    const keycloak = getKeycloak();

    clearStoredAuth();
    if (!keycloakInitialized) {
      return;
    }

    await keycloak.logout({
      redirectUri:
        typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : undefined,
    });
  },

  getAccessToken: (): string | null => {
    const keycloak = getKeycloak();

    if (keycloak.token) {
      return keycloak.token;
    }

    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token");
    }
    return null;
  },

  getUserRole: (): UserRole | null => {
    const keycloak = getKeycloak();
    const roles = keycloak.tokenParsed?.realm_access?.roles;
    if (roles) {
      return mapTokenRole(roles);
    }

    if (typeof window !== "undefined") {
      return localStorage.getItem("user_role") as UserRole;
    }
    return null;
  },

  getUserId: (): string | null => {
    const keycloak = getKeycloak();
    if (keycloak.tokenParsed?.sub) {
      return keycloak.tokenParsed.sub;
    }
    return null;
  },

  isAuthenticated: (): boolean => {
    const keycloak = getKeycloak();
    if (keycloak.authenticated) {
      return true;
    }

    if (typeof window !== "undefined") {
      return !!localStorage.getItem("access_token");
    }
    return false;
  },

  getUserInfo: async (
    _role: UserRole = "user",
  ): Promise<KeycloakUserInfo | null> => {
    void _role;

    const keycloak = getKeycloak();
    await authService.initKeycloak();

    if (!keycloak.authenticated) {
      return null;
    }

    try {
      const userInfo = (await keycloak.loadUserInfo()) as KeycloakUserInfo;
      return {
        ...userInfo,
        realm_access: {
          roles: keycloak.tokenParsed?.realm_access?.roles || [],
        },
      };
    } catch (error) {
      console.error("Failed to load Keycloak user info:", error);
      return null;
    }
  },
};
