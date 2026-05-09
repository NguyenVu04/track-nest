import React from "react";
import { render } from "@testing-library/react-native";
import TabsLayout from "@/app/(app)/(tabs)/_layout";

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("expo-router", () => ({
  Tabs: Object.assign(
    ({ children }: any) => children ?? null,
    { Screen: () => null },
  ),
  useRouter: () => ({ push: jest.fn() }),
  useSegments: () => ["map"],
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/contexts/AuthContext", () => ({
  useRequireAuth: jest.fn().mockReturnValue({
    isAuthenticated: true,
    isGuestMode: false,
  }),
}));
const mockUseDevMode = jest.fn().mockReturnValue({ devMode: false });
jest.mock("@/contexts/DevModeContext", () => ({
  useDevMode: () => mockUseDevMode(),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: (module: any) => module.English,
}));
jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "English" }),
}));
jest.mock("@/components/AppHeader", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/constant", () => ({
  CHAT_BADGE_CHANGED_EVENT: "chat_badge_changed",
  CHAT_UNREAD_KEY: "@chat_unread",
  OPEN_GENERAL_INFO_SHEET_EVENT: "open_general_info_sheet",
}));

describe("TabsLayout", () => {
  it("renders without crashing", () => {
    expect(() => render(<TabsLayout />)).not.toThrow();
  });

  it("returns null when not authenticated (non-dev)", () => {
    const { useRequireAuth } = require("@/contexts/AuthContext");
    useRequireAuth.mockReturnValue({
      isAuthenticated: false,
      isGuestMode: false,
    });
    const originalDev = (globalThis as any).__DEV__;
    (globalThis as any).__DEV__ = false;
    try {
      const { toJSON } = render(<TabsLayout />);
      expect(toJSON()).toBeNull();
    } finally {
      (globalThis as any).__DEV__ = originalDev;
      useRequireAuth.mockReturnValue({
        isAuthenticated: true,
        isGuestMode: false,
      });
    }
  });

  it("renders with dev mode tabs visible", () => {
    mockUseDevMode.mockReturnValue({ devMode: true });
    expect(() => render(<TabsLayout />)).not.toThrow();
    mockUseDevMode.mockReturnValue({ devMode: false });
  });
});
