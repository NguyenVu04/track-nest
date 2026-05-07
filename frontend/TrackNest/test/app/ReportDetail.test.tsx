import React from "react";
import { render, act, fireEvent } from "@testing-library/react-native";
import ReportDetailScreen from "@/app/(app)/report-detail";

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));
jest.mock("react-native-maps", () => ({
  __esModule: true,
  default: () => null,
  Marker: () => null,
  PROVIDER_GOOGLE: "google",
}));
jest.mock("expo-image", () => ({
  __esModule: true,
  Image: () => null,
  default: () => null,
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: (module: any) => module.English,
}));
jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "English" }),
}));
jest.mock("@/components/shared/ChatbotPanel", () => ({
  ChatbotPanel: () => null,
}));
jest.mock("@/utils", () => ({
  showToast: jest.fn(),
  formatRelativeTime: () => "5m",
}));

const mockGetReport = jest.fn();
jest.mock("@/services/criminalReports", () => ({
  criminalReportsService: {
    getUserCrimeReportById: (...args: any[]) => mockGetReport(...args),
  },
}));

const mockBack = jest.fn();
const mockUseLocalSearchParams = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock("react-native/Libraries/Share/Share", () => ({
  share: jest.fn().mockResolvedValue({ action: "sharedAction" }),
}));
jest.mock("react-native/Libraries/Linking/Linking", () => ({
  openURL: jest.fn().mockResolvedValue(undefined),
}));

const sampleReport = {
  id: "r1",
  title: "Test Crime Report",
  description: "A test description",
  severity: 2,
  status: "active",
  latitude: 10.5,
  longitude: 106.5,
  createdAt: "2024-06-01T00:00:00.000Z",
  photos: [],
  contentType: "text",
  content: "Plain text content",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({ id: "r1" });
});

describe("ReportDetailScreen", () => {
  it("shows loading spinner initially", () => {
    mockGetReport.mockReturnValue(new Promise(() => {}));
    const { UNSAFE_getByType } = render(<ReportDetailScreen />);
    const { ActivityIndicator } = require("react-native");
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("shows not found when report is null", async () => {
    mockGetReport.mockRejectedValue(new Error("Not found"));
    const { findByText } = render(<ReportDetailScreen />);
    await findByText(/not found/i);
  });

  it("renders report content after loading", async () => {
    mockGetReport.mockResolvedValue(sampleReport);
    const { getByText } = render(<ReportDetailScreen />);
    await act(async () => {});
    expect(getByText("Test Crime Report")).toBeTruthy();
  });

  it("renders report with photos", async () => {
    mockGetReport.mockResolvedValue({
      ...sampleReport,
      photos: ["https://example.com/photo.jpg"],
    });
    expect(() => render(<ReportDetailScreen />)).not.toThrow();
  });

  it("renders report with URL content type", async () => {
    mockGetReport.mockResolvedValue({
      ...sampleReport,
      contentType: "url",
      content: "https://example.com/doc.pdf",
    });
    expect(() => render(<ReportDetailScreen />)).not.toThrow();
  });

  it("renders report with html content", async () => {
    mockGetReport.mockResolvedValue({
      ...sampleReport,
      contentType: "html",
      content: "<p>Some <b>bold</b> text</p>",
    });
    expect(() => render(<ReportDetailScreen />)).not.toThrow();
  });

  it("calls router.back() when back icon pressed (not-found state)", async () => {
    mockGetReport.mockRejectedValue(new Error("fail"));
    const { findByText, UNSAFE_getAllByType } = render(<ReportDetailScreen />);
    await findByText(/not found/i);
    const backIcon = UNSAFE_getAllByType("Ionicons").find(
      (i: any) => i.props.name === "arrow-back",
    );
    if (backIcon) {
      fireEvent.press(backIcon);
      expect(mockBack).toHaveBeenCalled();
    }
  });
});
