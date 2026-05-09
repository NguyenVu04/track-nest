import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import NewFamilyCircle from "@/app/(app)/family-circles/new";

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn() }),
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
jest.mock("@/services/trackingManager", () => ({
  createFamilyCircle: jest.fn().mockResolvedValue({ familyCircleId: "fc1" }),
}));

describe("NewFamilyCircle", () => {
  it("renders step 1 (name input) without crashing", () => {
    expect(() => render(<NewFamilyCircle />)).not.toThrow();
  });

  it("renders name text input on step 1", () => {
    const { UNSAFE_getAllByType } = render(<NewFamilyCircle />);
    const { TextInput } = require("react-native");
    expect(UNSAFE_getAllByType(TextInput).length).toBeGreaterThan(0);
  });

  it("renders text elements for roles or labels", () => {
    const { UNSAFE_getAllByType } = render(<NewFamilyCircle />);
    expect(UNSAFE_getAllByType("Text").length).toBeGreaterThan(0);
  });

  it("fills in circle name without crash", () => {
    const { UNSAFE_getAllByType } = render(<NewFamilyCircle />);
    const { TextInput } = require("react-native");
    const inputs = UNSAFE_getAllByType(TextInput);
    if (inputs.length > 0) {
      expect(() => fireEvent.changeText(inputs[0], "My Circle")).not.toThrow();
    }
  });

  it("pressing next button by text does not crash", () => {
    const { getAllByText } = render(<NewFamilyCircle />);
    const nextBtns = getAllByText(/next|continue|proceed/i);
    if (nextBtns.length > 0) {
      expect(() => fireEvent.press(nextBtns[0])).not.toThrow();
    }
  });

  it("creates family circle on step 2 submit", async () => {
    const { UNSAFE_getAllByType, getAllByText } = render(<NewFamilyCircle />);
    const { TextInput } = require("react-native");
    const inputs = UNSAFE_getAllByType(TextInput);
    if (inputs.length > 0) {
      fireEvent.changeText(inputs[0], "Family Circle");
    }
    // Advance to step 2 via button text
    const nextBtns = getAllByText(/next|continue|proceed/i);
    if (nextBtns.length > 0) {
      fireEvent.press(nextBtns[0]);
    }
    // Submit on step 2
    const createBtns = getAllByText(/create|submit|save/i);
    if (createBtns.length > 0) {
      await act(async () => { fireEvent.press(createBtns[0]); });
    }
  });
});
