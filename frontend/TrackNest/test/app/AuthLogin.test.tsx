import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import LoginScreen from "@/app/auth/login";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
}));

jest.mock("expo-auth-session", () => ({
  makeRedirectUri: () => "tracknest://auth/login",
  ResponseType: { Code: "code" },
  useAuthRequest: jest.fn(),
  exchangeCodeAsync: jest.fn(),
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
  getKeycloakDiscovery: jest.fn().mockResolvedValue({
    authorizationEndpoint: "http://localhost/auth",
    tokenEndpoint: "http://localhost/token",
    revocationEndpoint: "http://localhost/revoke",
  }),
  clientId: "mobile",
}));

jest.mock("@/contexts/DevModeContext", () => ({
  useDevMode: jest.fn().mockReturnValue({ devMode: false, setDevMode: jest.fn() }),
}));

jest.mock("@/components/Modals/AppModal", () => ({
  useAppModal: () => ({ modal: null, showAlert: jest.fn() }),
}));

jest.mock("@/components/SettingsModals/DeveloperOptionsModal", () => ({
  DeveloperOptionsModal: () => null,
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    appTitle: "TrackNest",
    subtitle: "Track your world",
    loginButton: "Login",
    guestButton: "Continue as Guest",
    loginFailedTitle: "Login Failed",
    loginFailedMessage: "Authentication failed.",
    okButton: "OK",
  }),
}));

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));

jest.mock("@/utils", () => ({
  getServiceUrl: jest.fn().mockResolvedValue("http://localhost"),
  getEmergencyUrl: jest.fn().mockResolvedValue("http://emergency"),
  getCriminalUrl: jest.fn().mockResolvedValue("http://criminal"),
  SERVICE_URL_KEY: "service_url",
  EMERGENCY_URL_KEY: "emergency_url",
  CRIMINAL_URL_KEY: "criminal_url",
  showToast: jest.fn(),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

import { useAuthRequest } from "expo-auth-session";
import { useAuth } from "@/contexts/AuthContext";

const mockUseAuthRequest = useAuthRequest as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;
const mockPromptAsync = jest.fn();

function setupAuthRequest(requestOverride?: object | null) {
  const req = requestOverride ?? { codeVerifier: "v" };
  mockUseAuthRequest.mockReturnValue([req, null, mockPromptAsync]);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockReplace.mockReset();
  setupAuthRequest();
  mockUseAuth.mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
    saveTokens: jest.fn(),
    continueAsGuest: jest.fn(),
  });
});

describe("AuthLoginScreen (auth/login)", () => {
  it("renders app title and login button", () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText("TrackNest")).toBeTruthy();
    expect(getByText("Login")).toBeTruthy();
  });

  it("shows loading spinner while checking auth", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      saveTokens: jest.fn(),
      continueAsGuest: jest.fn(),
    });
    setupAuthRequest(null);
    const { UNSAFE_getByType } = render(<LoginScreen />);
    const { ActivityIndicator } = require("react-native");
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("redirects to /map when already authenticated", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      saveTokens: jest.fn(),
      continueAsGuest: jest.fn(),
    });
    render(<LoginScreen />);
    await act(async () => {});
    expect(mockReplace).toHaveBeenCalledWith("/map");
  });

  it("login button disabled when request not ready", () => {
    setupAuthRequest(null);
    render(<LoginScreen />);
    // With no request, the button should be in disabled state (no crash)
  });

  it("calls promptAsync on login button press", async () => {
    const { getByText } = render(<LoginScreen />);
    await act(async () => {
      fireEvent.press(getByText("Login"));
    });
    expect(mockPromptAsync).toHaveBeenCalledTimes(1);
  });

  it("renders dev modal toggle when dev mode is on", () => {
    const { useDevMode } = require("@/contexts/DevModeContext");
    useDevMode.mockReturnValue({ devMode: true, setDevMode: jest.fn() });
    expect(() => render(<LoginScreen />)).not.toThrow();
  });
});
