import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

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

jest.mock("@/contexts/EmergencyRequestRealtimeContext", () => ({
  EmergencyRequestRealtimeProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useEmergencyRequestRealtime: () => ({ refresh: 0 }),
}));

jest.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

jest.mock("@/components/ui/sonner", () => ({
  Toaster: () => null,
}));

import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it("renders children", () => {
    const { getByTestId } = render(
      // @ts-expect-error -- RootLayout returns an html element in tests
      <RootLayout>
        <div data-testid="child">hello</div>
      </RootLayout>,
    );
    expect(getByTestId("child")).toBeInTheDocument();
  });

  it("renders without crashing", () => {
    expect(() =>
      render(
        // @ts-expect-error
        <RootLayout><span>test</span></RootLayout>,
      ),
    ).not.toThrow();
  });
});
