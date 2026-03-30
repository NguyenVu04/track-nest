import axios from "axios";

const KEYCLOAK_BASE_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8080";
const USER_REALM = process.env.NEXT_PUBLIC_USER_REALM || "tracknest-user";
const REPORTER_REALM = process.env.NEXT_PUBLIC_REPORTER_REALM || "tracknest-reporter";
const EMERGENCY_REALM = process.env.NEXT_PUBLIC_EMERGENCY_REALM || "tracknest-emergency";

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

const getTokenUrl = (realm: string) => 
  `${KEYCLOAK_BASE_URL}/realms/${realm}/protocol/openid-connect/token`;

const getLogoutUrl = (realm: string) => 
  `${KEYCLOAK_BASE_URL}/realms/${realm}/protocol/openid-connect/logout`;

const getUserInfoUrl = (realm: string) => 
  `${KEYCLOAK_BASE_URL}/realms/${realm}/protocol/openid-connect/userinfo`;

const getClientId = (role: UserRole): string => {
  switch (role) {
    case "reporter":
      return "tracknest-reporter";
    case "emergency_services":
      return "tracknest-emergency";
    case "admin":
      return "tracknest-admin";
    default:
      return "tracknest";
  }
};

const getClientSecret = (role: UserRole): string => {
  switch (role) {
    case "reporter":
      return process.env.NEXT_PUBLIC_REPORTER_CLIENT_SECRET || "reporter-secret";
    case "emergency_services":
      return process.env.NEXT_PUBLIC_EMERGENCY_CLIENT_SECRET || "emergency-secret";
    case "admin":
      return process.env.NEXT_PUBLIC_ADMIN_CLIENT_SECRET || "admin-secret";
    default:
      return process.env.NEXT_PUBLIC_CLIENT_SECRET || "5YgzCDGJLO0uXBhkGMyeJjHE1CKUt4fJ";
  }
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

export const authService = {
  login: async (
    credentials: LoginCredentials,
    role: UserRole = "user"
  ): Promise<LoginResponse> => {
    const realm = getRealm(role);
    const clientId = getClientId(role);
    const clientSecret = getClientSecret(role);

    const params = new URLSearchParams({
      username: credentials.username,
      password: credentials.password,
      grant_type: "password",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "openid profile email",
    });

    const response = await axios.post<LoginResponse>(getTokenUrl(realm), params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("refresh_token", response.data.refresh_token);
      localStorage.setItem("token_type", response.data.token_type);
      localStorage.setItem("user_role", role);
      localStorage.setItem("user_realm", realm);
    }

    return response.data;
  },

  loginWithToken: async (
    accessToken: string,
    role: UserRole = "user"
  ): Promise<KeycloakUserInfo> => {
    const realm = getRealm(role);
    
    const response = await axios.get<KeycloakUserInfo>(getUserInfoUrl(realm), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  },

  refreshToken: async (refreshToken?: string): Promise<LoginResponse> => {
    const storedRefreshToken = refreshToken || 
      (typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null);
    
    if (!storedRefreshToken) {
      throw new Error("No refresh token available");
    }

    const role = (typeof window !== "undefined" ? localStorage.getItem("user_role") : "user") as UserRole || "user";
    const clientId = getClientId(role);
    const clientSecret = getClientSecret(role);

    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: storedRefreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await axios.post<LoginResponse>(getTokenUrl(getRealm(role)), params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("refresh_token", response.data.refresh_token);
    }

    return response.data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
    const role = (typeof window !== "undefined" ? localStorage.getItem("user_role") : "user") as UserRole || "user";
    const clientId = getClientId(role);
    const clientSecret = getClientSecret(role);

    if (refreshToken) {
      try {
        const params = new URLSearchParams({
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        });

        await axios.post(getLogoutUrl(getRealm(role)), params, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });
      } catch (error) {
        console.error("Logout error:", error);
      }
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("token_type");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_realm");
    }
  },

  getAccessToken: (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token");
    }
    return null;
  },

  getUserRole: (): UserRole | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("user_role") as UserRole;
    }
    return null;
  },

  isAuthenticated: (): boolean => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("access_token");
    }
    return false;
  },

  getUserInfo: async (): Promise<KeycloakUserInfo | null> => {
    const token = authService.getAccessToken();
    if (!token) return null;

    const role = authService.getUserRole() || "user";
    return authService.loginWithToken(token, role);
  },
};
