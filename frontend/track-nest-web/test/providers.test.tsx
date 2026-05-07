import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Providers } from "@/app/providers";

// Mock heavy context providers to avoid network / keycloak calls
jest.mock("@/services/authService", () => ({
  authService: {
    initKeycloak: jest.fn().mockResolvedValue(false),
    getUserInfo: jest.fn().mockResolvedValue(null),
    getUserRoles: jest.fn().mockReturnValue([]),
    logout: jest.fn().mockResolvedValue(undefined),
    loginWithKeycloak: jest.fn().mockResolvedValue(undefined),
    getAccessToken: jest.fn().mockReturnValue(null),
    refreshToken: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("@/services/stompService", () => ({
  default: {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    subscribe: jest.fn().mockReturnValue(null),
    isConnected: jest.fn().mockReturnValue(false),
  },
}));

// EmergencyRequestRealtimeProvider calls stompService — mock the context entirely
jest.mock("@/contexts/EmergencyRequestRealtimeContext", () => ({
  EmergencyRequestRealtimeProvider: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <>{children}</>,
  useEmergencyRequestRealtime: () => ({ refresh: 0, addNotification: jest.fn() }),
}));

describe("Providers", () => {
  it("renders children", () => {
    render(
      <Providers>
        <span data-testid="child">Hello</span>
      </Providers>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders multiple children", () => {
    render(
      <Providers>
        <span data-testid="first">First</span>
        <span data-testid="second">Second</span>
      </Providers>,
    );
    expect(screen.getByTestId("first")).toBeInTheDocument();
    expect(screen.getByTestId("second")).toBeInTheDocument();
  });

  it("does not render extra markup around children", () => {
    const { container } = render(
      <Providers>
        <div data-testid="only-child" />
      </Providers>,
    );
    expect(container.querySelector("[data-testid='only-child']")).toBeInTheDocument();
  });
});
