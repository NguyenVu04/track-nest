import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import GuidelineDetailScreen from "@/app/(app)/guideline-detail";
import type { GuidelinesDocument } from "@/types/criminalReports";

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));

const mockBack = jest.fn();
const mockUseLocalSearchParams = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

const mockGetGuideline = jest.fn();
jest.mock("@/services/criminalReports", () => ({
  criminalReportsService: {
    getUserGuidelinesById: (...args: any[]) => mockGetGuideline(...args),
  },
}));

jest.mock("@/components/shared/ChatbotPanel", () => ({
  ChatbotPanel: () => null,
}));

const sampleGuideline: GuidelinesDocument = {
  id: "g1",
  title: "Safety Guideline",
  abstractText: "Stay safe at all times.",
  content: "Detailed safety content here.",
  createdAt: "2024-06-01T00:00:00.000Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({ id: "g1" });
});

describe("GuidelineDetailScreen", () => {
  it("shows a loading spinner initially", () => {
    mockGetGuideline.mockReturnValue(new Promise(() => {})); // never resolves
    const { UNSAFE_getByType } = render(<GuidelineDetailScreen />);
    const { ActivityIndicator } = require("react-native");
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("shows guideline content after loading", async () => {
    mockGetGuideline.mockResolvedValue(sampleGuideline);
    const { getByText } = render(<GuidelineDetailScreen />);
    await waitFor(() => expect(getByText("Safety Guideline")).toBeTruthy());
    expect(getByText("Stay safe at all times.")).toBeTruthy();
    expect(getByText("Detailed safety content here.")).toBeTruthy();
  });

  it("shows 'not found' when guideline fetch fails", async () => {
    mockGetGuideline.mockRejectedValue(new Error("Not found"));
    const { getByText } = render(<GuidelineDetailScreen />);
    await waitFor(() => expect(getByText("Guideline not found")).toBeTruthy());
  });

  it("shows 'Guideline Detail' header title when guideline is loaded", async () => {
    mockGetGuideline.mockResolvedValue(sampleGuideline);
    const { getByText } = render(<GuidelineDetailScreen />);
    await waitFor(() => expect(getByText("Guideline Detail")).toBeTruthy());
  });

  it("shows back button 'Guideline' header when not found", async () => {
    mockGetGuideline.mockRejectedValue(new Error("fail"));
    const { getByText } = render(<GuidelineDetailScreen />);
    await waitFor(() => expect(getByText("Guideline")).toBeTruthy());
  });

  it("calls router.back() when back arrow icon pressed (not-found state)", async () => {
    mockGetGuideline.mockRejectedValue(new Error("fail"));
    const { getByText, UNSAFE_getAllByType } = render(<GuidelineDetailScreen />);
    await waitFor(() => getByText("Guideline not found"));
    const backIcon = UNSAFE_getAllByType("Ionicons").find(
      (i: any) => i.props.name === "arrow-back",
    );
    expect(backIcon).toBeTruthy();
    fireEvent.press(backIcon);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("calls router.back() when back arrow icon pressed (loaded state)", async () => {
    mockGetGuideline.mockResolvedValue(sampleGuideline);
    const { getByText, UNSAFE_getAllByType } = render(<GuidelineDetailScreen />);
    await waitFor(() => getByText("Safety Guideline"));
    const backIcon = UNSAFE_getAllByType("Ionicons").find(
      (i: any) => i.props.name === "arrow-back",
    );
    expect(backIcon).toBeTruthy();
    fireEvent.press(backIcon);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("does not call service when id is not provided", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: undefined });
    mockGetGuideline.mockResolvedValue(null);
    render(<GuidelineDetailScreen />);
    // The effect returns early if no id, but loading still resolves
    await waitFor(() => expect(mockGetGuideline).not.toHaveBeenCalled());
  });
});
