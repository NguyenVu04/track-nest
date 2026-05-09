import React from "react";
import { render, act } from "@testing-library/react-native";
import SosScreen from "@/app/(app)/sos";

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace, back: jest.fn() }),
  useLocalSearchParams: () => ({ autoActivate: undefined }),
}));
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: (module: any) => module.English,
}));
jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "English" }),
}));
jest.mock("@/utils", () => ({
  showToast: jest.fn(),
}));
jest.mock("axios", () => ({
  isAxiosError: jest.fn().mockReturnValue(false),
}));

const mockCreateEmergency = jest.fn();
jest.mock("@/contexts/EmergencyContext", () => ({
  useEmergency: () => ({
    createEmergencyRequest: mockCreateEmergency,
  }),
}));

const mockUseAuth = jest.fn();
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockCreateEmergency.mockResolvedValue({ id: "e1" });
  mockUseAuth.mockReturnValue({
    user: { id: "u1", username: "alice" },
    isLoading: false,
  });
});

describe("SosScreen", () => {
  it("renders countdown when user is authenticated", () => {
    const { UNSAFE_getAllByType } = render(<SosScreen />);
    expect(UNSAFE_getAllByType("Text").length).toBeGreaterThan(0);
  });

  it("redirects to map when user is null after auth loads", async () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });
    render(<SosScreen />);
    await act(async () => {});
    expect(mockReplace).toHaveBeenCalledWith("/map");
  });

  it("shows nothing special while auth is loading (no crash)", () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: true });
    expect(() => render(<SosScreen />)).not.toThrow();
  });

  it("renders countdown text", () => {
    const { UNSAFE_getAllByType } = render(<SosScreen />);
    const texts = UNSAFE_getAllByType("Text");
    expect(texts.length).toBeGreaterThan(0);
  });

  it("renders swipe/cancel area views", () => {
    const { UNSAFE_getAllByType } = render(<SosScreen />);
    const { View } = require("react-native");
    expect(UNSAFE_getAllByType(View).length).toBeGreaterThan(0);
  });
});
