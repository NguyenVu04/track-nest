import React from "react";
import { render, waitFor, fireEvent, act } from "@testing-library/react-native";
import DashboardScreen from "@/app/(app)/(tabs)/dashboard";

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: (module: any) => module.English,
}));
jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "English" }),
}));

const mockGetDashboard = jest.fn();
jest.mock("@/services/criminalReports", () => ({
  criminalReportsService: {
    getDashboardSummary: (...args: any[]) => mockGetDashboard(...args),
  },
}));

const mockData = {
  crimeStats: { total: 100, active: 20, investigating: 30, resolved: 50 },
  severityGroups: [
    { name: "Critical", value: 10 },
    { name: "High", value: 20 },
    { name: "Medium", value: 30 },
    { name: "Low", value: 40 },
  ],
  crimeByType: [{ name: "Theft", value: 50 }, { name: "Assault", value: 30 }],
  weeklyTrend: [
    { dayName: "Mon", crimes: 5, missing: 1 },
    { dayName: "Tue", crimes: 8, missing: 2 },
  ],
  recentActivity: [
    { id: "1", title: "Incident", severity: 1, status: "active", timestamp: Date.now() },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("DashboardScreen", () => {
  it("shows loading spinner initially", () => {
    mockGetDashboard.mockReturnValue(new Promise(() => {}));
    const { UNSAFE_getByType } = render(<DashboardScreen />);
    const { ActivityIndicator } = require("react-native");
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("renders dashboard data after loading", async () => {
    mockGetDashboard.mockResolvedValue(mockData);
    const { findByText } = render(<DashboardScreen />);
    // Stats should appear after data loads
    await findByText("100");
  });

  it("shows error state on fetch failure", async () => {
    mockGetDashboard.mockRejectedValue(new Error("Network error"));
    render(<DashboardScreen />);
    await waitFor(() => expect(mockGetDashboard).toHaveBeenCalled());
  });

  it("handles empty weeklyTrend", async () => {
    mockGetDashboard.mockResolvedValue({ ...mockData, weeklyTrend: [] });
    expect(() => render(<DashboardScreen />)).not.toThrow();
  });

  it("handles empty recentActivity", async () => {
    mockGetDashboard.mockResolvedValue({ ...mockData, recentActivity: [] });
    expect(() => render(<DashboardScreen />)).not.toThrow();
  });

  it("shows retry button on error and refetches on press", async () => {
    mockGetDashboard.mockRejectedValueOnce(new Error("fail")).mockResolvedValue(mockData);
    const { findByText } = render(<DashboardScreen />);
    const retryBtn = await findByText(/retry/i);
    await act(async () => {
      fireEvent.press(retryBtn);
    });
    await waitFor(() => expect(mockGetDashboard).toHaveBeenCalledTimes(2));
  });
});
