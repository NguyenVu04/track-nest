import React from "react";
import { render, act } from "@testing-library/react-native";
import OnboardingScreen from "@/app/onboarding";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: (module: any) => module.English,
}));
jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "English" }),
}));

const mockMarkCompleted = jest.fn();
jest.mock("@/utils/walkthrough", () => ({
  markIntroWalkthroughCompleted: () => mockMarkCompleted(),
}));

// Stub the slider — capture onDone/onSkip callbacks for test invocation
let capturedOnDone: (() => Promise<void>) | undefined;
let capturedOnSkip: (() => Promise<void>) | undefined;

function mockAppIntroSlider(props: any) {
  capturedOnDone = props.onDone;
  capturedOnSkip = props.onSkip;
  return null;
}

jest.mock("react-native-app-intro-slider", () => mockAppIntroSlider);

beforeEach(() => {
  jest.clearAllMocks();
  mockMarkCompleted.mockResolvedValue(undefined);
  capturedOnDone = undefined;
  capturedOnSkip = undefined;
});

describe("OnboardingScreen", () => {
  it("renders without crashing", () => {
    expect(() => render(<OnboardingScreen />)).not.toThrow();
  });

  it("marks walkthrough completed and navigates to / on done", async () => {
    render(<OnboardingScreen />);
    await act(async () => {
      if (capturedOnDone) await capturedOnDone();
    });
    expect(mockMarkCompleted).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("marks walkthrough completed and navigates to / on skip", async () => {
    render(<OnboardingScreen />);
    await act(async () => {
      if (capturedOnSkip) await capturedOnSkip();
    });
    expect(mockMarkCompleted).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("does not call markCompleted twice once finishing has started", async () => {
    render(<OnboardingScreen />);
    // First call sets isFinishing=true and awaits; second call sees isFinishing=true
    await act(async () => {
      if (capturedOnDone) await capturedOnDone();
    });
    await act(async () => {
      if (capturedOnDone) await capturedOnDone();
    });
    expect(mockMarkCompleted).toHaveBeenCalledTimes(1);
  });
});
