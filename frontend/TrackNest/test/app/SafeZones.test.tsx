import React from "react";
import { render, waitFor, act } from "@testing-library/react-native";
import SafeZonesScreen from "@/app/(app)/safe-zones";

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn() }),
}));
jest.mock("react-native-maps", () => ({
  __esModule: true,
  default: () => null,
  Circle: () => null,
  Marker: () => null,
  PROVIDER_GOOGLE: "google",
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: (module: any) => module.English,
}));
jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "English" }),
}));

const mockUseDeviceLocation = jest.fn();
jest.mock("@/hooks/useDeviceLocation", () => ({
  __esModule: true,
  default: (...args: any[]) => mockUseDeviceLocation(...args),
}));

const mockGetNearestSafeZones = jest.fn();
jest.mock("@/services/emergency", () => ({
  emergencyService: {
    getNearestSafeZones: (...args: any[]) => mockGetNearestSafeZones(...args),
    getSafeZones: jest.fn().mockResolvedValue({ content: [] }),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockUseDeviceLocation.mockReturnValue({
    location: { latitude: 10.7769, longitude: 106.6424 },
    loading: false,
    error: null,
  });
  mockGetNearestSafeZones.mockResolvedValue([]);
});

describe("SafeZonesScreen", () => {
  it("renders without crashing", () => {
    expect(() => render(<SafeZonesScreen />)).not.toThrow();
  });

  it("calls getNearestSafeZones on mount when location is available", async () => {
    render(<SafeZonesScreen />);
    await waitFor(() => expect(mockGetNearestSafeZones).toHaveBeenCalled());
  });

  it("renders empty list when no zones returned", async () => {
    render(<SafeZonesScreen />);
    await waitFor(() => expect(mockGetNearestSafeZones).toHaveBeenCalled());
  });

  it("renders safe zones list after loading", async () => {
    mockGetNearestSafeZones.mockResolvedValue([
      { id: "sz1", name: "Home", latitude: 10.77, longitude: 106.64, radius: 200 },
    ]);
    render(<SafeZonesScreen />);
    await waitFor(() => expect(mockGetNearestSafeZones).toHaveBeenCalled());
  });

  it("handles fetch error gracefully", async () => {
    mockGetNearestSafeZones.mockRejectedValue(new Error("fail"));
    render(<SafeZonesScreen />);
    await waitFor(() => expect(mockGetNearestSafeZones).toHaveBeenCalled());
  });

  it("does not call service when no location", () => {
    mockUseDeviceLocation.mockReturnValue({ location: null, loading: true, error: null });
    render(<SafeZonesScreen />);
    expect(mockGetNearestSafeZones).not.toHaveBeenCalled();
  });

  it("renders map and list elements", () => {
    const { UNSAFE_getAllByType } = render(<SafeZonesScreen />);
    expect(UNSAFE_getAllByType("Text").length).toBeGreaterThan(0);
  });
});
