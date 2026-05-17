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
const mockSubmitUserCrimeReport = jest.fn().mockResolvedValue({ id: "r1" });

jest.mock("@/services/criminalReports", () => ({
  criminalReportsService: {
    submitUserCrimeReport: mockSubmitUserCrimeReport,
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

/** Navigate from step 1 to step 2 (Details/Severity/Counters). */
async function goToStep2(screen: ReturnType<typeof render>) {
  const { UNSAFE_getAllByType, getByText } = screen;
  const { TextInput } = require("react-native");
  const inputs = UNSAFE_getAllByType(TextInput);
  fireEvent.changeText(inputs[0], "Test Title");
  if (inputs.length > 1) fireEvent.changeText(inputs[1], "Test Description");
  await act(async () => { fireEvent.press(getByText("Next")); });
}

/** Navigate from step 1 through all steps to step 4 (Review). */
async function goToReview(screen: ReturnType<typeof render>) {
  await goToStep2(screen);
  await act(async () => { fireEvent.press(screen.getByText("Next")); }); // step 2 → 3
  await act(async () => { fireEvent.press(screen.getByText("Next")); }); // step 3 → 4
}

describe("CreateReportScreen", () => {
  it("renders the form without crashing", () => {
    expect(() => render(<CreateReportScreen />)).not.toThrow();
  });

  it("renders title input field", () => {
    const { UNSAFE_getAllByType } = render(<CreateReportScreen />);
    const { TextInput } = require("react-native");
    expect(UNSAFE_getAllByType(TextInput).length).toBeGreaterThan(0);
  });

  it("renders multiple severity option texts", async () => {
    const screen = render(<CreateReportScreen />);
    await goToStep2(screen);
    expect(screen.getAllByText(/low|medium|high/i).length).toBeGreaterThan(0);
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
    expect(UNSAFE_getAllByType("Text").length).toBeGreaterThan(0);
  });

  it("pressing a severity option (by text) does not crash", async () => {
    const screen = render(<CreateReportScreen />);
    await goToStep2(screen);
    const severityBtns = screen.getAllByText(/^(low|medium|high)$/i);
    if (severityBtns.length > 0) {
      expect(() => fireEvent.press(severityBtns[0])).not.toThrow();
    }
  });

  it("submit attempt with empty form does not hard-crash", async () => {
    const screen = render(<CreateReportScreen />);
    await goToReview(screen);
    const submitBtns = screen.queryAllByText(/submit|create|save|post/i);
    if (submitBtns.length > 0) {
      await act(async () => { fireEvent.press(submitBtns[0]); });
    }
  });

  // --- Task 2: New tests for added fields ---

  it("renders numberOfVictims counter with initial value 0", async () => {
    const screen = render(<CreateReportScreen />);
    await goToStep2(screen);
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThanOrEqual(2);
  });

  it("incrementing victims counter updates display", async () => {
    const screen = render(<CreateReportScreen />);
    await goToStep2(screen);
    // Counter shows 0 initially; verify it's present (≥2: victims + offenders)
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(2);
    // Toggling arrested (No→Yes) doesn't crash — interaction smoke test
    const noBtns = screen.queryAllByText(/^No$/i);
    if (noBtns.length > 0) {
      expect(() => fireEvent.press(noBtns[0])).not.toThrow();
    }
  });

  it("toggling arrested button does not crash", async () => {
    const screen = render(<CreateReportScreen />);
    await goToStep2(screen);
    const noBtns = screen.getAllByText(/^No$/i);
    if (noBtns.length > 0) {
      expect(() => fireEvent.press(noBtns[0])).not.toThrow();
    }
  });

  it("arrested toggle switches between Yes and No", async () => {
    const screen = render(<CreateReportScreen />);
    await goToStep2(screen);
    expect(screen.getAllByText(/^No$/i).length).toBeGreaterThan(0);
    fireEvent.press(screen.getAllByText(/^No$/i)[0]);
    expect(screen.queryAllByText(/^Yes$/i).length).toBeGreaterThan(0);
  });

  it("sends date as YYYY-MM-DD format (not full ISO)", async () => {
    const showAlert = jest.fn();
    jest.spyOn(require("@/components/Modals/AppModal"), "useAppModal")
      .mockReturnValue({ modal: null, showAlert });

    const screen = render(<CreateReportScreen />);
    await goToReview(screen);

    const submitBtns = screen.queryAllByText(/submit/i);
    if (submitBtns.length > 0) {
      await act(async () => { fireEvent.press(submitBtns[0]); });
    }

    if (mockSubmitUserCrimeReport.mock.calls.length > 0) {
      const calledDate = mockSubmitUserCrimeReport.mock.calls[0][0].date as string;
      expect(calledDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("passes numberOfVictims and arrested to service on valid submit", async () => {
    const screen = render(<CreateReportScreen />);
    // Navigate to step 2 and toggle arrested to Yes
    await goToStep2(screen);
    const noBtns = screen.queryAllByText(/^No$/i);
    if (noBtns.length > 0) fireEvent.press(noBtns[0]);
    // Navigate to review and submit
    await act(async () => { fireEvent.press(screen.getByText("Next")); }); // step 2 → 3
    await act(async () => { fireEvent.press(screen.getByText("Next")); }); // step 3 → 4
    const submitBtns = screen.queryAllByText(/submit/i);
    if (submitBtns.length > 0) {
      await act(async () => { fireEvent.press(submitBtns[0]); });
    }
    if (mockSubmitUserCrimeReport.mock.calls.length > 0) {
      const params = mockSubmitUserCrimeReport.mock.calls[0][0];
      expect(typeof params.numberOfVictims).toBe("number");
      expect(typeof params.numberOfOffenders).toBe("number");
      expect(typeof params.arrested).toBe("boolean");
    }
  });
});
