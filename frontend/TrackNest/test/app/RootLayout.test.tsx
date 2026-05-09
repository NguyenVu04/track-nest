import React from "react";
import { render } from "@testing-library/react-native";
import RootLayout from "@/app/_layout";

jest.mock("cross-fetch", () => jest.fn(), { virtual: true });

jest.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: any) => children,
}));
jest.mock("@/contexts/DevModeContext", () => ({
  DevModeProvider: ({ children }: any) => children,
}));
jest.mock("@/contexts/LanguageContext", () => ({
  LanguageProvider: ({ children }: any) => children,
}));
jest.mock("@/contexts/ProfileContext", () => ({
  ProfileProvider: ({ children }: any) => children,
}));
jest.mock("@/contexts/SettingsContext", () => ({
  SettingsProvider: ({ children }: any) => children,
}));
jest.mock("@/contexts/TrackingContext", () => ({
  TrackingProvider: ({ children }: any) => children,
}));
jest.mock("@/contexts/EmergencyContext", () => ({
  EmergencyProvider: ({ children }: any) => children,
}));
jest.mock("@/contexts/ReportsContext", () => ({
  ReportsProvider: ({ children }: any) => children,
}));
jest.mock("@/contexts/POIAnalyticsContext", () => ({
  POIAnalyticsProvider: ({ children }: any) => children,
}));
jest.mock("@/contexts/MapContext", () => ({
  MapProvider: ({ children }: any) => children,
}));

jest.mock("@/hooks/useDistractionTracker", () => ({
  useDistractionTracker: jest.fn(),
}));
jest.mock("@/hooks/useDrivingMode", () => ({
  useDrivingMode: jest.fn().mockReturnValue(null),
}));

jest.mock("@/services/backgroundTasks", () => ({}), { virtual: true });

jest.mock("expo-router", () => ({
  Stack: Object.assign(
    ({ children }: any) => children ?? null,
    { Screen: () => null },
  ),
}));

describe("RootLayout", () => {
  it("renders without crashing", () => {
    expect(() => render(<RootLayout />)).not.toThrow();
  });
});
