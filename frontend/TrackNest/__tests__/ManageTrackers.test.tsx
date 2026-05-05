/**
 * Use case under test:
 *  - TRACK-UC-06: Remove a member from a family circle.
 */

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/services/trackingManager", () => ({
  listFamilyCircles: jest.fn(),
  listFamilyCircleMembers: jest.fn(),
  removeMemberFromFamilyCircle: jest.fn(),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    pageTitle: "Manage Members",
    deleteConfirm: "Remove Member",
    removeFromCircleMessage: "Remove {{member}} from {{circle}}?",
    cancelButton: "Cancel",
    removeButton: "Remove",
    onlineStatus: "Online",
    offlineStatus: "Offline",
    lastPing: "Last ping:",
    adminSuffix: "(Admin)",
    addNewTracker: "Add New",
    errorTitle: "Error",
    removeFailedMessage: "Removal failed",
  }),
}));

jest.mock("@/utils", () => ({
  showToast: jest.fn(),
  getInitials: (s: string) => s.slice(0, 2).toUpperCase(),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name, ...props }: any) => {
    const { View } = require("react-native");
    return <View testID={`icon-${name}`} {...props} />;
  },
}));

import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import ManageTrackersScreen from "@/app/(app)/manage-trackers";
import {
  listFamilyCircles,
  listFamilyCircleMembers,
  removeMemberFromFamilyCircle,
} from "@/services/trackingManager";

const mockListCircles = listFamilyCircles as jest.Mock;
const mockListMembers = listFamilyCircleMembers as jest.Mock;
const mockRemoveMember = removeMemberFromFamilyCircle as jest.Mock;

const fixtureCircle = { familyCircleId: "circle-1", name: "Smith Family" };
const fixtureMember = {
  memberId: "member-1",
  memberUsername: "alice",
  familyRole: "Parent",
  isAdmin: false,
  online: true,
  lastActiveMs: Date.now(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockListCircles.mockResolvedValue({ familyCirclesList: [fixtureCircle] });
  mockListMembers.mockResolvedValue({ membersList: [fixtureMember] });
  mockRemoveMember.mockResolvedValue({});
  jest.spyOn(Alert, "alert");
});

describe("ManageTrackersScreen — TRACK-UC-06", () => {
  it("loads and renders circle members on mount", async () => {
    const { getByText } = render(<ManageTrackersScreen />);

    await waitFor(() => expect(getByText("alice")).toBeTruthy());
    expect(mockListCircles).toHaveBeenCalledTimes(1);
    expect(mockListMembers).toHaveBeenCalledWith("circle-1");
  });

  it("shows an Alert with the member name when the trash icon is pressed", async () => {
    const { getAllByTestId, getByText } = render(<ManageTrackersScreen />);
    await waitFor(() => expect(getByText("alice")).toBeTruthy());

    const trashBtn = getAllByTestId("icon-trash")[0];
    await act(async () => { fireEvent.press(trashBtn); });

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    const [title, message] = (Alert.alert as jest.Mock).mock.calls[0];
    expect(title).toBe("Remove Member");
    expect(message).toContain("alice");
    expect(message).toContain("Smith Family");
  });

  it("calls removeMemberFromFamilyCircle and removes the row when confirmed", async () => {
    const { getAllByTestId, getByText, queryByText } = render(<ManageTrackersScreen />);
    await waitFor(() => expect(getByText("alice")).toBeTruthy());

    const trashBtn = getAllByTestId("icon-trash")[0];
    await act(async () => { fireEvent.press(trashBtn); });

    // Get the destructive ("Remove") button from the Alert call.
    const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
    const destructive = alertButtons.find((b: any) => b.style === "destructive");
    expect(destructive).toBeDefined();

    await act(async () => { await destructive.onPress(); });

    expect(mockRemoveMember).toHaveBeenCalledWith("circle-1", "member-1");
    await waitFor(() => expect(queryByText("alice")).toBeNull());
  });

  it("does NOT call removeMemberFromFamilyCircle when the user cancels", async () => {
    const { getAllByTestId, getByText } = render(<ManageTrackersScreen />);
    await waitFor(() => expect(getByText("alice")).toBeTruthy());

    const trashBtn = getAllByTestId("icon-trash")[0];
    await act(async () => { fireEvent.press(trashBtn); });

    const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2] as any[];
    const cancelBtn = alertButtons.find((b: any) => b.style === "cancel");
    expect(cancelBtn).toBeDefined();
    await act(async () => { cancelBtn.onPress?.(); });

    expect(mockRemoveMember).not.toHaveBeenCalled();
    expect(getByText("alice")).toBeTruthy();
  });
});
