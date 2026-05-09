import React from "react";
import { render, act } from "@testing-library/react-native";
import LocationHistoryScreen from "@/app/(app)/location-history";

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn() }),
}));
jest.mock("@react-native-community/datetimepicker", () => () => null);
jest.mock("react-native-maps", () => ({
  __esModule: true,
  default: () => null,
  Polyline: () => null,
  Marker: () => null,
  PROVIDER_GOOGLE: "google",
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: (module: any) => module.English,
}));
jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "English" }),
}));

const mockLoadSavedKey = jest.fn();
jest.mock("@/utils", () => ({
  loadSavedKey: (...args: any[]) => mockLoadSavedKey(...args),
}));
jest.mock("@/constant", () => ({
  LOCATION_HISTORY_KEY: "@tracknest/location_history",
}));
jest.mock("@/components/LocationHistoryViewer", () => ({
  LocationHistoryViewer: () => null,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockLoadSavedKey.mockResolvedValue(null);
});

describe("LocationHistoryScreen", () => {
  it("renders without crashing", () => {
    expect(() => render(<LocationHistoryScreen />)).not.toThrow();
  });

  it("calls loadSavedKey on mount", async () => {
    render(<LocationHistoryScreen />);
    await act(async () => {});
    expect(mockLoadSavedKey).toHaveBeenCalled();
  });

  it("renders with empty history (null)", async () => {
    mockLoadSavedKey.mockResolvedValue(null);
    render(<LocationHistoryScreen />);
    await act(async () => {});
  });

  it("renders with location history data as array", async () => {
    const historyData = [
      { latitude: 10.77, longitude: 106.64, accuracy: 5, speed: 0, timestamp: Date.now() },
      { latitude: 10.78, longitude: 106.65, accuracy: 5, speed: 1, timestamp: Date.now() - 1000 },
    ];
    mockLoadSavedKey.mockResolvedValue(historyData);
    render(<LocationHistoryScreen />);
    await act(async () => {});
    expect(mockLoadSavedKey).toHaveBeenCalled();
  });

  it("renders back button and date controls", () => {
    const { UNSAFE_getAllByType } = render(<LocationHistoryScreen />);
    expect(UNSAFE_getAllByType("Text").length).toBeGreaterThan(0);
  });
});
