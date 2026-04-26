import LoginScreen from "@/app/(auth)/login";
import { render, fireEvent, act } from "@testing-library/react-native";
import React from "react";

// --- mocks ---

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockPromptAsync = jest.fn();
jest.mock("expo-auth-session", () => ({
  makeRedirectUri: () => "tracknest://redirect",
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

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    appTitle: "TrackNest",
    subtitle: "Track your world with ease",
    loginButton: "Login",
    loginFailedTitle: "Login Failed",
    loginFailedMessage: "Authentication failed.",
    okButton: "OK",
  }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

// silence console noise from the component
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

// helpers to configure mocks per test
import { useAuthRequest } from "expo-auth-session";
import { useAuth } from "@/contexts/AuthContext";

const mockUseAuthRequest = useAuthRequest as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;

function setupAuthRequest(overrides: Partial<{ request: object | null }> = {}) {
  const request = "request" in overrides ? overrides.request : { codeVerifier: "verifier123" };
  mockUseAuthRequest.mockReturnValue([request, null, mockPromptAsync]);
}

function setupAuth(overrides: Partial<{ isAuthenticated: boolean; isLoading: boolean }> = {}) {
  mockUseAuth.mockReturnValue({
    isAuthenticated: overrides.isAuthenticated ?? false,
    isLoading: overrides.isLoading ?? false,
    saveTokens: jest.fn(),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  setupAuth();
  setupAuthRequest();
});

// --- tests ---

describe("LoginScreen", () => {
  it("renders app title and login button", () => {
    const { getByText } = render(<LoginScreen />);

    expect(getByText("TrackNest")).toBeTruthy();
    expect(getByText("Track your world with ease")).toBeTruthy();
    expect(getByText("Login")).toBeTruthy();
  });

  it("shows loading spinner while checking existing auth", () => {
    setupAuth({ isLoading: true });
    setupAuthRequest({ request: null });

    const { queryByText, UNSAFE_getByType } = render(<LoginScreen />);
    const { ActivityIndicator } = require("react-native");

    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(queryByText("Login")).toBeNull();
  });

  it("redirects to /map when already authenticated", () => {
    setupAuth({ isAuthenticated: true, isLoading: false });

    render(<LoginScreen />);

    expect(mockReplace).toHaveBeenCalledWith("/map");
  });

  it("login button is disabled when request is not ready", () => {
    setupAuthRequest({ request: null });

    const { getByText } = render(<LoginScreen />);
    // Walk up from the Text node to find the Pressable (disabled button)
    let node = getByText("Login").parent;
    while (node && node.props.disabled === undefined) {
      node = node.parent ?? null;
    }

    expect(node?.props.disabled).toBe(true);
  });

  it("calls promptAsync when login button is pressed", async () => {
    const { getByText } = render(<LoginScreen />);

    await act(async () => {
      fireEvent.press(getByText("Login"));
    });

    expect(mockPromptAsync).toHaveBeenCalledTimes(1);
  });
});
