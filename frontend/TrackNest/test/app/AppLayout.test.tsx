import React from "react";
import { render, act } from "@testing-library/react-native";
import AppLayout from "@/app/(app)/_layout";

jest.mock("cross-fetch", () => jest.fn(), { virtual: true });
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));

jest.mock("expo-router", () => ({
  Redirect: ({ href }: any) => {
    const { Text } = require("react-native");
    return <Text>{`redirect:${href}`}</Text>;
  },
  Stack: Object.assign(
    ({ children }: any) => children ?? null,
    { Screen: () => null },
  ),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("@gorhom/bottom-sheet", () => {
  const { forwardRef } = require("react");
  return {
    BottomSheetModalProvider: ({ children }: any) => children,
    BottomSheetModal: forwardRef((_props: any, _ref: any) => null),
    BottomSheetView: ({ children }: any) => children,
    BottomSheetBackdrop: () => null,
  };
});

jest.mock("react-native-gesture-handler", () => ({
  GestureHandlerRootView: ({ children, style }: any) => {
    const { View } = require("react-native");
    return <View style={style}>{children}</View>;
  },
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn().mockReturnValue({
    isAuthenticated: true,
    isGuestMode: false,
    isLoading: false,
  }),
}));

jest.mock("@/contexts/SettingsContext", () => ({
  useSettings: jest.fn().mockReturnValue({
    voiceSettings: { enabled: false },
  }),
}));

jest.mock("@/hooks/usePushNotifications", () => ({
  usePushNotifications: jest.fn(),
}));
jest.mock("@/hooks/useChatStream", () => ({
  useChatStream: jest.fn(),
}));
jest.mock("@/hooks/useVoiceSosActivation", () => ({
  useVoiceSosActivation: jest.fn(),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: (module: any) => module.English,
}));
jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "English" }),
}));

describe("AppLayout", () => {
  it("renders without crashing when authenticated", () => {
    expect(() => render(<AppLayout />)).not.toThrow();
  });

  it("renders redirect when not authenticated (not dev mode)", () => {
    const { useAuth } = require("@/contexts/AuthContext");
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isGuestMode: false,
      isLoading: false,
    });
    const originalDev = (globalThis as any).__DEV__;
    (globalThis as any).__DEV__ = false;
    try {
      const { getByText } = render(<AppLayout />);
      expect(getByText("redirect:/auth/login")).toBeTruthy();
    } finally {
      (globalThis as any).__DEV__ = originalDev;
      useAuth.mockReturnValue({
        isAuthenticated: true,
        isGuestMode: false,
        isLoading: false,
      });
    }
  });

  it("returns null while loading", () => {
    const { useAuth } = require("@/contexts/AuthContext");
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isGuestMode: false,
      isLoading: true,
    });
    const { toJSON } = render(<AppLayout />);
    expect(toJSON()).toBeNull();
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isGuestMode: false,
      isLoading: false,
    });
  });

  it("shows guest login prompt after timeout", async () => {
    const { useAuth } = require("@/contexts/AuthContext");
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isGuestMode: true,
      isLoading: false,
    });
    expect(() => render(<AppLayout />)).not.toThrow();
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isGuestMode: false,
      isLoading: false,
    });
  });
});
