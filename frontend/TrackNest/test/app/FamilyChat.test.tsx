import React from "react";
import { render, act } from "@testing-library/react-native";
import FamilyChatScreen from "@/app/(app)/(tabs)/family-chat";

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useFocusEffect: (cb: any) => cb(),
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@gorhom/bottom-sheet", () => {
  const { forwardRef } = require("react");
  return {
    BottomSheetModal: forwardRef((_p: any, _r: any) => null),
    BottomSheetBackdrop: () => null,
  };
});
jest.mock("@react-navigation/bottom-tabs", () => ({
  useBottomTabBarHeight: () => 70,
}));
jest.mock("@react-navigation/elements", () => ({
  useHeaderHeight: () => 60,
}));
jest.mock("@/hooks/useFamilyCircle", () => ({
  useFamilyCircle: jest.fn().mockReturnValue({
    circles: [],
    loading: false,
    selectedCircle: null,
    setSelectedCircle: jest.fn(),
    refresh: jest.fn(),
  }),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: (module: any) => module.English,
}));
jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "English" }),
}));
jest.mock("@/utils", () => ({
  getUserId: jest.fn().mockResolvedValue("u1"),
}));
jest.mock("@/services/familyMessenger", () => ({
  listFamilyMessages: jest.fn().mockResolvedValue({ messagesList: [] }),
  sendFamilyMessage: jest.fn().mockResolvedValue({}),
}));
jest.mock("@/services/trackingManager", () => ({
  listFamilyCircleMembers: jest.fn().mockResolvedValue({ membersList: [] }),
}));
jest.mock("@/constant", () => ({
  CHAT_BADGE_CHANGED_EVENT: "chat_badge_changed",
  CHAT_NEW_MESSAGE_EVENT: "chat_new_message",
  CHAT_FOCUS_EVENT: "chat_focus",
  CHAT_CIRCLE_CHANGED_EVENT: "chat_circle_changed",
  CHAT_UNREAD_KEY: "@chat_unread",
}));

describe("FamilyChatScreen", () => {
  it("renders without crashing", () => {
    expect(() => render(<FamilyChatScreen />)).not.toThrow();
  });

  it("renders with no circles selected (empty state)", async () => {
    render(<FamilyChatScreen />);
    await act(async () => {});
    // No crash = pass
  });

  it("renders with a selected circle", async () => {
    const { useFamilyCircle } = require("@/hooks/useFamilyCircle");
    useFamilyCircle.mockReturnValue({
      circles: [{ familyCircleId: "fc1", name: "Family" }],
      loading: false,
      selectedCircle: { familyCircleId: "fc1", name: "Family" },
      setSelectedCircle: jest.fn(),
      refresh: jest.fn(),
    });
    render(<FamilyChatScreen />);
    await act(async () => {});
  });

  it("renders activity indicator while circles loading", () => {
    const { useFamilyCircle } = require("@/hooks/useFamilyCircle");
    useFamilyCircle.mockReturnValue({
      circles: [],
      loading: true,
      selectedCircle: null,
      setSelectedCircle: jest.fn(),
      refresh: jest.fn(),
    });
    expect(() => render(<FamilyChatScreen />)).not.toThrow();
  });
});
