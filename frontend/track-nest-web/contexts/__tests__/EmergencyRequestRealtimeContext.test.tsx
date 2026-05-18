"use client";
/**
 * Tests for EmergencyRequestRealtimeContext — Task 4c
 *
 * Verifies that:
 * 1. The context exposes realtimeLocation (new field)
 * 2. realtimeLocation starts as null
 * 3. useEmergencyRequestRealtime throws when used outside provider
 */

import React from "react";
import { render, act } from "@testing-library/react";
import {
  EmergencyRequestRealtimeProvider,
  useEmergencyRequestRealtime,
  RealtimeLocation,
} from "@/contexts/EmergencyRequestRealtimeContext";

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));

jest.mock("@/contexts/NotificationContext", () => ({
  useNotification: () => ({ addNotification: jest.fn() }),
}));

jest.mock("@/services/authService", () => ({
  authService: { getAccessToken: jest.fn().mockReturnValue(null) },
}));

jest.mock("@/services/stompService", () => ({
  default: {
    connect: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
    disconnect: jest.fn(),
  },
}));

// ── Helper consumer ──────────────────────────────────────────────────────────

let capturedRefresh: number | undefined;
let capturedLocation: RealtimeLocation | null | undefined;

function TestConsumer() {
  const { refresh, realtimeLocation } = useEmergencyRequestRealtime();
  capturedRefresh = refresh;
  capturedLocation = realtimeLocation;
  return null;
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  capturedRefresh = undefined;
  capturedLocation = undefined;
});

describe("EmergencyRequestRealtimeContext (Task 4c)", () => {
  it("provides initial refresh=0 and realtimeLocation=null", async () => {
    await act(async () => {
      render(
        <EmergencyRequestRealtimeProvider>
          <TestConsumer />
        </EmergencyRequestRealtimeProvider>,
      );
    });

    expect(capturedRefresh).toBe(0);
    expect(capturedLocation).toBeNull();
  });

  it("throws when useEmergencyRequestRealtime is used outside provider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      "useEmergencyRequestRealtime must be used within EmergencyRequestRealtimeProvider",
    );
    consoleSpy.mockRestore();
  });

  it("exposes realtimeLocation with correct shape (type check)", () => {
    const location: RealtimeLocation = {
      userId: "user-123",
      latitude: 10.7769,
      longitude: 106.6424,
      timestamp: Date.now(),
    };
    expect(location).toHaveProperty("userId");
    expect(location).toHaveProperty("latitude");
    expect(location).toHaveProperty("longitude");
    expect(location).toHaveProperty("timestamp");
    expect(typeof location.latitude).toBe("number");
    expect(typeof location.longitude).toBe("number");
  });

  it("does not connect STOMP when user is null (not authenticated)", async () => {
    const stompService = require("@/services/stompService").default;
    await act(async () => {
      render(
        <EmergencyRequestRealtimeProvider>
          <TestConsumer />
        </EmergencyRequestRealtimeProvider>,
      );
    });
    expect(stompService.connect).not.toHaveBeenCalled();
  });
});
