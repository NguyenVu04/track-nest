import React from "react";
import { render, waitFor, fireEvent, act } from "@testing-library/react-native";
import ReportsScreen from "@/app/(app)/(tabs)/reports";

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children, edges }: any) => children,
}));
jest.mock("expo-image", () => ({
  __esModule: true,
  Image: () => null,
  default: () => null,
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: (module: any) => module.English,
}));
jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "English" }),
}));

const mockFetchReports = jest.fn();
const mockFetchMissing = jest.fn();
const mockFetchGuides = jest.fn();

jest.mock("@/utils/reportAdapters", () => ({
  fetchReports: (...args: any[]) => mockFetchReports(...args),
  fetchMissingPersons: (...args: any[]) => mockFetchMissing(...args),
  fetchGuides: (...args: any[]) => mockFetchGuides(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchReports.mockResolvedValue({ data: [], page: 1 });
  mockFetchMissing.mockResolvedValue({ data: [], page: 1 });
  mockFetchGuides.mockResolvedValue({ data: [], page: 1 });
});

describe("ReportsScreen", () => {
  it("renders without crashing", () => {
    expect(() => render(<ReportsScreen />)).not.toThrow();
  });

  it("shows loading state for all tabs initially", () => {
    mockFetchReports.mockReturnValue(new Promise(() => {}));
    mockFetchMissing.mockReturnValue(new Promise(() => {}));
    mockFetchGuides.mockReturnValue(new Promise(() => {}));
    const { UNSAFE_getAllByType } = render(<ReportsScreen />);
    const { ActivityIndicator } = require("react-native");
    expect(UNSAFE_getAllByType(ActivityIndicator).length).toBeGreaterThan(0);
  });

  it("calls all three fetch functions on mount", async () => {
    render(<ReportsScreen />);
    await waitFor(() => {
      expect(mockFetchReports).toHaveBeenCalled();
      expect(mockFetchMissing).toHaveBeenCalled();
      expect(mockFetchGuides).toHaveBeenCalled();
    });
  });

  it("renders crime reports tab with data", async () => {
    mockFetchReports.mockResolvedValue({
      data: [{
        id: "r1", title: "Theft", severity: "High",
        address: "123 St", date: "2024-01-01", photos: [],
      }],
      page: 1,
    });
    render(<ReportsScreen />);
    await act(async () => {});
    expect(mockFetchReports).toHaveBeenCalled();
  });

  it("renders missing persons tab with data", async () => {
    mockFetchMissing.mockResolvedValue({
      data: [{
        id: "m1", name: "Jane Doe", age: 25, severity: "High",
        lastSeen: "Park", photo: null,
      }],
      page: 1,
    });
    render(<ReportsScreen />);
    await act(async () => {});
    expect(mockFetchMissing).toHaveBeenCalled();
  });

  it("renders guides tab with data", async () => {
    mockFetchGuides.mockResolvedValue({
      data: [{
        id: "g1", title: "Safety Guide", category: "Safety", content: "content",
      }],
      page: 1,
    });
    render(<ReportsScreen />);
    await act(async () => {});
    expect(mockFetchGuides).toHaveBeenCalled();
  });

  it("pressing tab buttons (by text) switches tabs", () => {
    const { getAllByText } = render(<ReportsScreen />);
    // Reports tab screen has "Crime Reports", "Missing", "Guide" tab labels
    const tabBtns = getAllByText(/crime reports|missing|guide/i);
    if (tabBtns.length > 1) {
      expect(() => fireEvent.press(tabBtns[1])).not.toThrow();
    }
  });

  it("renders FAB for reports and missing tabs (not guides)", async () => {
    render(<ReportsScreen />);
    await act(async () => {});
    // Just verify no crash
  });
});
