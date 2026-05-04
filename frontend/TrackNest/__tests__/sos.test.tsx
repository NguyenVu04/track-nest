/**
 * Use case under test:
 *  - EMERGENCY-UC-00: Activate Emergency Alert by pressing the SOS button.
 *
 * The SOS screen starts a 10-second countdown then auto-triggers the emergency.
 * Passing autoActivate=1 bypasses the countdown for immediate triggering.
 */

const mockReplace = jest.fn();
const mockCreateEmergency = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: jest.fn(),
}));

jest.mock("@/contexts/EmergencyContext", () => ({
  useEmergency: jest.fn(),
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    title: "EMERGENCY",
    loginRequired: "Login required",
    notifyingSubtitle: "Notifying family{newline}Stay calm.",
    actionRequired: "ACTION REQUIRED",
    swipeToCancel: "Swipe to cancel",
    creatingEmergency: "Creating emergency...",
    emergencyActivatedTitle: "Emergency Activated",
    emergencyActivatedBody: "Help is on the way",
    emergencyCancelledTitle: "Cancelled",
    emergencyCancelledBody: "Emergency cancelled",
    emergencyTimeoutTitle: "Timeout",
    emergencyTimeoutBody: "Request timed out",
    emergencyAlreadyActiveTitle: "Already Active",
    emergencyAlreadyActiveBody: "A request is already active",
    emergencyFailedTitle: "Failed",
    emergencyFailedBody: "Emergency request failed",
    sosNotificationChannel: "SOS",
  }),
}));

jest.mock("@/utils", () => ({
  showToast: jest.fn(),
}));

jest.mock("axios", () => ({
  isAxiosError: jest.fn().mockReturnValue(false),
}));

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  AndroidImportance: { HIGH: 4 },
}));

jest.mock("@/styles/styles", () => ({
  colors: { danger: "#e53e3e" },
}));

import React from "react";
import { render, waitFor, act } from "@testing-library/react-native";
import SosScreen from "@/app/(app)/sos";
import { useEmergency } from "@/contexts/EmergencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalSearchParams } from "expo-router";
import { isAxiosError } from "axios";
import { showToast } from "@/utils";

const mockShowToast = showToast as jest.Mock;
const mockUseEmergency = useEmergency as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockIsAxiosError = isAxiosError as jest.Mock;

const testUser = { sub: "user-123", id: "user-123" };

function setupMocks(params: Record<string, string> = {}) {
  mockUseLocalSearchParams.mockReturnValue(params);
  mockUseAuth.mockReturnValue({
    user: testUser,
    isLoading: false,
  });
  mockUseEmergency.mockReturnValue({
    createEmergencyRequest: mockCreateEmergency,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockCreateEmergency.mockResolvedValue({ id: "req-1" });
  mockIsAxiosError.mockReturnValue(false);
  setupMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("SosScreen — EMERGENCY-UC-00", () => {
  it("renders the countdown number and swipe-to-cancel label", () => {
    const { getByText } = render(<SosScreen />);

    expect(getByText("10")).toBeTruthy();
    expect(getByText("Swipe to cancel")).toBeTruthy();
  });

  it("shows the screen title", () => {
    const { getByText } = render(<SosScreen />);
    expect(getByText("EMERGENCY")).toBeTruthy();
  });

  describe("autoActivate = 1 (immediate trigger)", () => {
    it("calls createEmergencyRequest without waiting for countdown", async () => {
      setupMocks({ autoActivate: "1" });
      render(<SosScreen />);

      await waitFor(() =>
        expect(mockCreateEmergency).toHaveBeenCalledWith("user-123"),
      );
    });

    it("navigates to /map after a successful emergency request", async () => {
      setupMocks({ autoActivate: "1" });
      render(<SosScreen />);

      await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/map"));
    });

    it("shows an 'already active' toast on 409 and still navigates to /map", async () => {
      setupMocks({ autoActivate: "1" });
      const err409 = { response: { status: 409 } };
      mockCreateEmergency.mockRejectedValue(err409);
      mockIsAxiosError.mockReturnValue(true);

      render(<SosScreen />);

      await waitFor(() =>
        expect(mockShowToast).toHaveBeenCalledWith(
          "A request is already active",
          "Already Active",
        ),
      );
      expect(mockReplace).toHaveBeenCalledWith("/map");
    });
  });

  describe("Countdown auto-trigger (no autoActivate)", () => {
    it("calls createEmergencyRequest when the 10-second countdown completes", async () => {
      render(<SosScreen />);

      // Advance fake timers by 10 seconds to drain the countdown.
      await act(async () => {
        jest.advanceTimersByTime(10_000);
      });

      await waitFor(() =>
        expect(mockCreateEmergency).toHaveBeenCalledWith("user-123"),
      );
    });
  });

  describe("Auth guard", () => {
    it("redirects to /map when user is not authenticated", () => {
      mockUseAuth.mockReturnValue({ user: null, isLoading: false });
      render(<SosScreen />);

      expect(mockReplace).toHaveBeenCalledWith("/map");
    });
  });
});
