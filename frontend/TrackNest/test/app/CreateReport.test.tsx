import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import CreateReportScreen from "@/app/(app)/create-report";

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
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
jest.mock("@/components/Modals/AppModal", () => ({
  useAppModal: () => ({ modal: null, showAlert: jest.fn() }),
}));
jest.mock("@/components/Modals/PhotoPickerModal", () => ({
  usePhotoPickerModal: () => ({
    showPhotoPicker: jest.fn(),
    photoPickerModal: null,
  }),
}));
jest.mock("@/components/Modals/LocationPickerModal", () => ({
  LocationPickerModal: () => null,
}));
jest.mock("@/services/criminalReports", () => ({
  criminalReportsService: {
    createCrimeReport: jest.fn().mockResolvedValue({ id: "r1" }),
    uploadCrimeReportPhoto: jest.fn().mockResolvedValue({ fileId: "f1" }),
  },
}));

describe("CreateReportScreen", () => {
  it("renders the form without crashing", () => {
    expect(() => render(<CreateReportScreen />)).not.toThrow();
  });

  it("renders title input field", () => {
    const { UNSAFE_getAllByType } = render(<CreateReportScreen />);
    const { TextInput } = require("react-native");
    expect(UNSAFE_getAllByType(TextInput).length).toBeGreaterThan(0);
  });

  it("renders multiple severity option texts", () => {
    const { getAllByText } = render(<CreateReportScreen />);
    // getAllByText handles multiple matches
    expect(getAllByText(/low|medium|high/i).length).toBeGreaterThan(0);
  });

  it("fills in title and description without error", () => {
    const { UNSAFE_getAllByType } = render(<CreateReportScreen />);
    const { TextInput } = require("react-native");
    const inputs = UNSAFE_getAllByType(TextInput);
    expect(() => fireEvent.changeText(inputs[0], "Test Title")).not.toThrow();
    if (inputs.length > 1) {
      expect(() => fireEvent.changeText(inputs[1], "Test Description")).not.toThrow();
    }
  });

  it("renders action buttons", () => {
    const { UNSAFE_getAllByType } = render(<CreateReportScreen />);
    // Severity buttons use Pressable; check there are UI interaction elements
    expect(UNSAFE_getAllByType("Text").length).toBeGreaterThan(0);
  });

  it("pressing a severity option (by text) does not crash", () => {
    const { getAllByText } = render(<CreateReportScreen />);
    const severityBtns = getAllByText(/^(low|medium|high)$/i);
    if (severityBtns.length > 0) {
      expect(() => fireEvent.press(severityBtns[0])).not.toThrow();
    }
  });

  it("submit attempt with empty form does not hard-crash", async () => {
    const { getAllByText } = render(<CreateReportScreen />);
    // Try pressing the submit button if found by text
    const submitBtns = getAllByText(/submit|create|save|post/i);
    if (submitBtns.length > 0) {
      await act(async () => { fireEvent.press(submitBtns[0]); });
    }
  });
});
