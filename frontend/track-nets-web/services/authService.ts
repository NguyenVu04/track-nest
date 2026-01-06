import axios from "axios";

const AUTH_API_URL =
  "http://localhost:8080/realms/tracknest-user/protocol/openid-connect/token";

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

export const authService = {
  /**
   * Login to Keycloak using password grant type
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const params = new URLSearchParams({
      username: credentials.username,
      password: credentials.password,
      grant_type: "password",
      client_id: "tracknest",
      client_secret: "5YgzCDGJLO0uXBhkGMyeJjHE1CKUt4fJ",
      scope: "openid profile",
    });

    const response = await axios.post<LoginResponse>(AUTH_API_URL, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return response.data;
  },

  /**
   * Refresh access token using refresh token
   */
  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: "tracknest",
      client_secret: "5YgzCDGJLO0uXBhkGMyeJjHE1CKUt4fJ",
    });

    const response = await axios.post<LoginResponse>(AUTH_API_URL, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return response.data;
  },

  /**
   * Logout from Keycloak
   */
  logout: async (refreshToken: string): Promise<void> => {
    const logoutUrl =
      "http://localhost:8080/realms/tracknest-user/protocol/openid-connect/logout";

    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: "tracknest",
      client_secret: "5YgzCDGJLO0uXBhkGMyeJjHE1CKUt4fJ",
    });

    await axios.post(logoutUrl, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  },
};
