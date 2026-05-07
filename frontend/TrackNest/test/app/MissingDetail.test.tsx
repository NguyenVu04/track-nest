import React from "react";
import { render, act, waitFor } from "@testing-library/react-native";
import MissingDetailScreen from "@/app/(app)/missing-detail";

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
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: (module: any) => module.English,
}));
jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "English" }),
}));
jest.mock("@/components/shared/ChatbotPanel", () => ({
  ChatbotPanel: () => null,
}));
// expo-image uses a default export
jest.mock("expo-image", () => ({
  __esModule: true,
  Image: () => null,
  default: () => null,
}));
jest.mock("@/utils", () => ({
  showToast: jest.fn(),
  formatRelativeTime: () => "5m",
}));

const mockGetMissing = jest.fn();
const mockGetPhotoUrl = jest.fn();
jest.mock("@/services/criminalReports", () => ({
  criminalReportsService: {
    getUserMissingPersonReportById: (...args: any[]) => mockGetMissing(...args),
    getMissingPersonPhotoUrl: (...args: any[]) => mockGetPhotoUrl(...args),
  },
}));

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
  useLocalSearchParams: () => ({ id: "mp1" }),
}));

jest.mock("react-native/Libraries/Share/Share", () => ({
  share: jest.fn().mockResolvedValue({ action: "sharedAction" }),
}));
jest.mock("react-native/Libraries/Linking/Linking", () => ({
  openURL: jest.fn().mockResolvedValue(undefined),
}));

const samplePerson = {
  id: "mp1",
  fullName: "Jane Doe",
  age: 25,
  gender: "Female",
  lastSeenLocation: "City Center",
  lastSeenDate: "2024-06-01",
  description: "Missing since June 1",
  status: "PUBLISHED",
  latitude: 10.5,
  longitude: 106.5,
  contactPhone: "0901234567",
  createdAt: "2024-06-01T00:00:00.000Z",
  photoId: "photo-1",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetPhotoUrl.mockResolvedValue("https://example.com/photo.jpg");
});

describe("MissingDetailScreen", () => {
  it("shows loading spinner initially", () => {
    mockGetMissing.mockReturnValue(new Promise(() => {}));
    const { UNSAFE_getByType } = render(<MissingDetailScreen />);
    const { ActivityIndicator } = require("react-native");
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("shows not found on fetch error", async () => {
    mockGetMissing.mockRejectedValue(new Error("Not found"));
    const { findByText } = render(<MissingDetailScreen />);
    await findByText(/not found/i);
  });

  it("renders person full name after loading", async () => {
    mockGetMissing.mockResolvedValue(samplePerson);
    const { getByText } = render(<MissingDetailScreen />);
    await act(async () => {});
    expect(getByText("Jane Doe")).toBeTruthy();
  });

  it("renders REJECTED status without crashing", async () => {
    mockGetMissing.mockResolvedValue({ ...samplePerson, status: "REJECTED" });
    render(<MissingDetailScreen />);
    await waitFor(() => expect(mockGetMissing).toHaveBeenCalled());
  });

  it("renders without location coordinates", async () => {
    mockGetMissing.mockResolvedValue({
      ...samplePerson,
      latitude: null,
      longitude: null,
    });
    render(<MissingDetailScreen />);
    await waitFor(() => expect(mockGetMissing).toHaveBeenCalled());
  });

  it("renders without photoId", async () => {
    mockGetMissing.mockResolvedValue({ ...samplePerson, photoId: null });
    render(<MissingDetailScreen />);
    await waitFor(() => expect(mockGetMissing).toHaveBeenCalled());
  });
});
