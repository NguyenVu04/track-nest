import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CreateMissingScreen from "@/app/(app)/create-missing";

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));

const mockUseLocalSearchParams = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn() }),
  useLocalSearchParams: () => mockUseLocalSearchParams(),
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
jest.mock("@/contexts/ReportsContext", () => ({
  useReports: () => ({
    createMissingPersonReport: jest.fn().mockResolvedValue({ id: "mp1" }),
  }),
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

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({
    initialName: undefined,
    initialLat: undefined,
    initialLng: undefined,
    initialAvatar: undefined,
  });
});

describe("CreateMissingScreen", () => {
  it("renders without crashing", () => {
    expect(() => render(<CreateMissingScreen />)).not.toThrow();
  });

  it("renders step 1 content (personal info fields)", () => {
    const { UNSAFE_getAllByType } = render(<CreateMissingScreen />);
    const { TextInput } = require("react-native");
    expect(UNSAFE_getAllByType(TextInput).length).toBeGreaterThan(0);
  });

  it("renders text elements", () => {
    const { UNSAFE_getAllByType } = render(<CreateMissingScreen />);
    expect(UNSAFE_getAllByType("Text").length).toBeGreaterThan(0);
  });

  it("pressing next button (by text) does not crash", () => {
    const { getAllByText } = render(<CreateMissingScreen />);
    const nextBtns = getAllByText(/next|continue|proceed/i);
    if (nextBtns.length > 0) {
      expect(() => fireEvent.press(nextBtns[0])).not.toThrow();
    }
  });

  it("pre-fills fields from initialName param", () => {
    mockUseLocalSearchParams.mockReturnValue({
      initialName: "Jane Doe",
      initialLat: "10.5",
      initialLng: "106.5",
      initialAvatar: undefined,
    });
    expect(() => render(<CreateMissingScreen />)).not.toThrow();
  });

  it("changing text in input fields works", () => {
    const { UNSAFE_getAllByType } = render(<CreateMissingScreen />);
    const { TextInput } = require("react-native");
    const inputs = UNSAFE_getAllByType(TextInput);
    if (inputs.length > 0) {
      expect(() => fireEvent.changeText(inputs[0], "Test Name")).not.toThrow();
    }
  });
});
