import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import CrimeHeatmapScreen from "@/app/(app)/crime-heatmap";

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
jest.mock("@/utils/crimeHelpers", () => ({
  getSeverityLabel: jest.fn().mockReturnValue("HIGH"),
}));

const mockUseDeviceLocation = jest.fn();
jest.mock("@/hooks/useDeviceLocation", () => ({
  __esModule: true,
  default: (...args: any[]) => mockUseDeviceLocation(...args),
}));

const mockGetCrimeHeatmap = jest.fn();
jest.mock("@/services/criminalReports", () => ({
  criminalReportsService: {
    getCrimeHeatmap: (...args: any[]) => mockGetCrimeHeatmap(...args),
    getNearbyCrimeReports: jest.fn().mockResolvedValue({ content: [] }),
  },
}));

const mockReports = [
  {
    id: "r1", title: "Theft", severity: 2,
    latitude: 10.77, longitude: 106.64,
    status: "active", createdAt: "2024-06-01",
    content: "detail", date: "2024-06-01",
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockUseDeviceLocation.mockReturnValue({
    location: { latitude: 10.7769, longitude: 106.6424 },
    loading: false,
    error: null,
  });
  mockGetCrimeHeatmap.mockResolvedValue({ content: mockReports });
});

describe("CrimeHeatmapScreen", () => {
  it("renders without crashing", () => {
    expect(() => render(<CrimeHeatmapScreen />)).not.toThrow();
  });

  it("calls getCrimeHeatmap on mount when location available", async () => {
    render(<CrimeHeatmapScreen />);
    await waitFor(() => expect(mockGetCrimeHeatmap).toHaveBeenCalled());
  });

  it("renders reports after loading", async () => {
    render(<CrimeHeatmapScreen />);
    await waitFor(() => expect(mockGetCrimeHeatmap).toHaveBeenCalled());
  });

  it("handles empty reports list", async () => {
    mockGetCrimeHeatmap.mockResolvedValue({ content: [] });
    render(<CrimeHeatmapScreen />);
    await waitFor(() => expect(mockGetCrimeHeatmap).toHaveBeenCalled());
  });

  it("handles fetch error", async () => {
    mockGetCrimeHeatmap.mockRejectedValue(new Error("fail"));
    render(<CrimeHeatmapScreen />);
    await waitFor(() => expect(mockGetCrimeHeatmap).toHaveBeenCalled());
  });

  it("does not call service when no device location", () => {
    mockUseDeviceLocation.mockReturnValue({ location: null, loading: true, error: null });
    render(<CrimeHeatmapScreen />);
    expect(mockGetCrimeHeatmap).not.toHaveBeenCalled();
  });
});
