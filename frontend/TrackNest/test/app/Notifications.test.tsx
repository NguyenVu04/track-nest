import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import NotificationsScreen from "@/app/(app)/notifications";

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));
jest.mock("@/utils", () => ({
  formatTimeAgo: (_ms: number) => "5m ago",
}));

const mockFetchAll = jest.fn();
const mockClearAll = jest.fn();

jest.mock("@/hooks/useNotifications", () => ({
  useNotifications: () => ({
    trackingNotifications: [],
    riskNotifications: [],
    loading: false,
    fetchAll: mockFetchAll,
    clearAll: mockClearAll,
    clearTrackingTab: jest.fn(),
    clearRiskTab: jest.fn(),
    deleteTracking: jest.fn(),
    deleteRisk: jest.fn(),
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchAll.mockResolvedValue(undefined);
});

describe("NotificationsScreen", () => {
  it("renders without crashing", () => {
    const { unmount } = render(<NotificationsScreen />);
    unmount();
  });

  it("calls fetchAll on mount", async () => {
    render(<NotificationsScreen />);
    await waitFor(() => expect(mockFetchAll).toHaveBeenCalled());
  });

  it("renders tab header text", () => {
    const { UNSAFE_getAllByType } = render(<NotificationsScreen />);
    expect(UNSAFE_getAllByType("Text").length).toBeGreaterThan(0);
  });

  it("renders Ionicons icons", () => {
    const { UNSAFE_getAllByType } = render(<NotificationsScreen />);
    expect(UNSAFE_getAllByType("Ionicons").length).toBeGreaterThan(0);
  });
});
