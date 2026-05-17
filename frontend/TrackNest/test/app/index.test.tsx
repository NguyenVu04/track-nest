import React from "react";
import { render, act } from "@testing-library/react-native";
import Index from "@/app/index";

// --- mocks ---

const mockUseAuth = jest.fn();
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("expo-router", () => ({
  Redirect: ({ href }: any) => {
    const { Text } = require("react-native");
    return <Text>{`redirect:${href}`}</Text>;
  },
}));

const mockHasCompleted = jest.fn();
jest.mock("@/utils/walkthrough", () => ({
  hasCompletedIntroWalkthrough: () => mockHasCompleted(),
}));

jest.mock("@/utils", () => ({
  registerBackgroundTaskAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/utils/notifications", () => ({
  setupUploadNotificationChannel: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestBackgroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
}));

jest.mock("expo-notifications", () => ({
  registerTaskAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/constant", () => ({
  BACKGROUND_LOCATION_UPLOAD_TASK_NAME: "bg-location",
  BACKGROUND_NOTIFICATION_TASK_NAME: "bg-notification",
}));

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] });
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue({
    isAuthenticated: false,
    isGuestMode: false,
    isLoading: false,
  });
  mockHasCompleted.mockResolvedValue(true);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("Index screen", () => {
  it("shows a loading spinner while auth is loading", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isGuestMode: false,
      isLoading: true,
    });
    const { UNSAFE_getByType } = render(<Index />);
    const LottieView = require("lottie-react-native");
    expect(UNSAFE_getByType(LottieView)).toBeTruthy();
  });

  it("redirects to /onboarding when intro not completed", async () => {
    mockHasCompleted.mockResolvedValue(false);
    const { getByText } = render(<Index />);
    // Flush pending async effects (intro check promise)
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    // Advance past the 2-second splash delay
    await act(async () => { jest.runAllTimers(); });
    expect(getByText("redirect:/onboarding")).toBeTruthy();
  });

  it("redirects to /map when authenticated and intro done", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isGuestMode: false,
      isLoading: false,
    });
    const { getByText } = render(<Index />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    await act(async () => { jest.runAllTimers(); });
    expect(getByText("redirect:/map")).toBeTruthy();
  });

  it("redirects to /map when in guest mode and intro done", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isGuestMode: true,
      isLoading: false,
    });
    const { getByText } = render(<Index />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    await act(async () => { jest.runAllTimers(); });
    expect(getByText("redirect:/map")).toBeTruthy();
  });

  it("redirects to /auth/login when unauthenticated and intro done", async () => {
    const originalDev = (global as any).__DEV__;
    (global as any).__DEV__ = false;
    try {
      const { getByText } = render(<Index />);
      await act(async () => { await Promise.resolve(); await Promise.resolve(); });
      await act(async () => { jest.runAllTimers(); });
      expect(getByText("redirect:/auth/login")).toBeTruthy();
    } finally {
      (global as any).__DEV__ = originalDev;
    }
  });
});
