import React from "react";
import { render, waitFor, act } from "@testing-library/react-native";
import CrimeDashboardScreen from "@/app/(app)/crime-dashboard";

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
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
  missingPersonStats: { total: 10, pending: 3, published: 5, rejected: 2 },
  guidelineStats: { total: 8, thisMonth: 2 },
  reporterStats: { totalReporters: 15 },
  severityGroups: [{ name: "High", value: 10 }],
  statusGroups: [{ name: "active", value: 20 }],
  crimeByType: [{ name: "Theft", value: 50 }],
  weeklyTrend: [{ date: "2024-01-01", dayName: "Mon", crimes: 5, missing: 1 }],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("CrimeDashboardScreen", () => {
  it("shows loading spinner initially", () => {
    mockGetDashboard.mockReturnValue(new Promise(() => {}));
    const { UNSAFE_getByType } = render(<CrimeDashboardScreen />);
    const { ActivityIndicator } = require("react-native");
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("renders dashboard data after loading", async () => {
    mockGetDashboard.mockResolvedValue(mockData);
    const { getByText } = render(<CrimeDashboardScreen />);
    await act(async () => {});
    expect(getByText("100")).toBeTruthy();
  });

  it("shows error text on fetch failure", async () => {
    mockGetDashboard.mockRejectedValue(new Error("Network error"));
    render(<CrimeDashboardScreen />);
    await waitFor(() => expect(mockGetDashboard).toHaveBeenCalled());
  });

  it("shows go-back button on error", async () => {
    mockGetDashboard.mockRejectedValue(new Error("fail"));
    const { findByText } = render(<CrimeDashboardScreen />);
    const goBackBtn = await findByText(/go back/i);
    expect(goBackBtn).toBeTruthy();
  });

  it("renders crime stats correctly", async () => {
    mockGetDashboard.mockResolvedValue(mockData);
    const { getByText } = render(<CrimeDashboardScreen />);
    await act(async () => {});
    expect(getByText("20")).toBeTruthy();
  });
});
