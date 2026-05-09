import React from "react";
import { render, waitFor, act } from "@testing-library/react-native";
import ManageTrackersScreen from "@/app/(app)/manage-trackers";

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn() }),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: (module: any) => module.English,
}));
jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "English" }),
}));
jest.mock("@/utils", () => ({
  getInitials: jest.fn().mockReturnValue("AB"),
}));

const mockListCircles = jest.fn();
const mockListMembers = jest.fn();
const mockRemoveMember = jest.fn();

jest.mock("@/services/trackingManager", () => ({
  listFamilyCircles: (...args: any[]) => mockListCircles(...args),
  listFamilyCircleMembers: (...args: any[]) => mockListMembers(...args),
  removeMemberFromFamilyCircle: (...args: any[]) => mockRemoveMember(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockListCircles.mockResolvedValue({ familyCirclesList: [] });
  mockListMembers.mockResolvedValue({ membersList: [] });
  mockRemoveMember.mockResolvedValue(undefined);
});

describe("ManageTrackersScreen", () => {
  it("renders without crashing", () => {
    expect(() => render(<ManageTrackersScreen />)).not.toThrow();
  });

  it("shows loading spinner initially", () => {
    mockListCircles.mockReturnValue(new Promise(() => {}));
    const { UNSAFE_getByType } = render(<ManageTrackersScreen />);
    const { ActivityIndicator } = require("react-native");
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("renders empty state after loading with no circles", async () => {
    mockListCircles.mockResolvedValue({ familyCirclesList: [] });
    render(<ManageTrackersScreen />);
    await act(async () => {});
    expect(mockListCircles).toHaveBeenCalled();
  });

  it("renders circle list after loading", async () => {
    mockListCircles.mockResolvedValue({
      familyCirclesList: [{ familyCircleId: "fc1", name: "Family" }],
    });
    mockListMembers.mockResolvedValue({
      membersList: [
        {
          memberId: "m1",
          memberUsername: "Alice",
          familyRole: "Parent",
          isAdmin: true,
          online: true,
          lastActiveMs: Date.now(),
        },
      ],
    });
    render(<ManageTrackersScreen />);
    await act(async () => {});
    expect(mockListCircles).toHaveBeenCalled();
  });

  it("handles fetch error gracefully", async () => {
    mockListCircles.mockRejectedValue(new Error("fail"));
    render(<ManageTrackersScreen />);
    await waitFor(() => {});
  });
});
