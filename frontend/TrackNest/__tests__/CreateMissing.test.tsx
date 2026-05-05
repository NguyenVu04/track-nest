/**
 * Use case under test:
 *  - REPORT-UC-00: Submit a missing person report (4-step form).
 */

const mockRouterBack = jest.fn();
const mockShowAlert = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockRouterBack }),
  useLocalSearchParams: () => ({}),
}));

jest.mock("@/contexts/ReportsContext", () => ({
  useReports: jest.fn(),
}));

jest.mock("@/components/Modals/AppModal", () => ({
  useAppModal: () => ({ modal: null, showAlert: mockShowAlert }),
}));

jest.mock("@/components/Modals/PhotoPickerModal", () => ({
  usePhotoPickerModal: () => ({ photoPickerModal: null, showPhotoPicker: jest.fn() }),
}));

jest.mock("@/components/Modals/LocationPickerModal", () => ({
  LocationPickerModal: () => null,
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    errorTitle: "Error",
    fullNameRequired: "Full name is required",
    titleRequired: "Title is required",
    personalIdRequired: "Personal ID is required",
    descriptionRequired: "Description is required",
    contactPhoneRequired: "Phone is required",
    successTitle: "Success",
    submitSuccess: "Report submitted",
    okButton: "OK",
    submitError: "Submission failed",
    stepOf: "Step {current} of {total}",
    stepByStepTitle: "Missing Person Report",
    stepBasicInfo: "Basic Info",
    stepDetails: "Details",
    stepContact: "Contact",
    stepReview: "Review",
    fullNameLabel: "Full Name",
    fullNamePlaceholder: "Enter full name",
    nicknameLabel: "Nickname",
    nicknamePlaceholder: "Nickname",
    titleLabel: "Title",
    titlePlaceholder: "Report title",
    personalIdLabel: "Personal ID",
    personalIdPlaceholder: "ID number",
    dateLabel: "Date",
    datePlaceholder: "YYYY-MM-DD",
    descriptionLabel: "Description",
    descriptionPlaceholder: "Physical description",
    contactPhoneLabel: "Contact Phone",
    contactPhonePlaceholder: "+1 234 567",
    contactEmailLabel: "Contact Email",
    contactEmailPlaceholder: "email@example.com",
    locationLabel: "Location",
    reviewTitle: "Review Your Report",
    cancelButton: "Cancel",
    nextStep: "Next",
    submit: "Submit",
    photoLabel: "Add Photo",
  }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("expo-image", () => ({
  Image: "Image",
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children, ...p }: any) => <View {...p}>{children}</View>,
  };
});

jest.mock("@/styles/styles", () => ({
  colors: {
    primary: "#74becb",
    primaryLight: "#b4dede",
    primaryDark: "#3e8d98",
  },
}));

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import CreateMissingScreen from "@/app/(app)/create-missing";
import { useReports } from "@/contexts/ReportsContext";

const mockUseReports = useReports as jest.Mock;
const mockCreateReport = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockCreateReport.mockResolvedValue({ id: "mp-new" });
  mockUseReports.mockReturnValue({ createMissingPersonReport: mockCreateReport });
});

/** Fills the 4-step form and arrives at the review step. */
async function fillAllSteps(queries: ReturnType<typeof render>) {
  const { getByPlaceholderText, getByText } = queries;

  // Step 1 — basic info.
  fireEvent.changeText(getByPlaceholderText("Enter full name"), "Sarah Johnson");
  await act(async () => { fireEvent.press(getByText("Next")); });

  // Step 2 — details.
  fireEvent.changeText(getByPlaceholderText("Report title"), "Missing: Sarah");
  fireEvent.changeText(getByPlaceholderText("ID number"), "ID-001");
  fireEvent.changeText(getByPlaceholderText("Physical description"), "Blonde hair, blue eyes");
  await act(async () => { fireEvent.press(getByText("Next")); });

  // Step 3 — contact.
  fireEvent.changeText(getByPlaceholderText("+1 234 567"), "+84 90 000 0000");
  await act(async () => { fireEvent.press(getByText("Next")); });
}

describe("CreateMissingScreen — REPORT-UC-00", () => {
  it("shows a validation alert when Next is pressed on step 1 with no full name", async () => {
    const { getByText } = render(<CreateMissingScreen />);

    await act(async () => { fireEvent.press(getByText("Next")); });

    expect(mockShowAlert).toHaveBeenCalledWith(
      "Error",
      "Full name is required",
      "warning",
    );
  });

  it("advances through all 4 steps after filling required fields", async () => {
    const q = render(<CreateMissingScreen />);
    await fillAllSteps(q);

    // Step 4 shows the review title and a Submit button.
    expect(q.getByText("Review Your Report")).toBeTruthy();
    expect(q.getByText("Submit")).toBeTruthy();
  });

  it("calls createMissingPersonReport with the correct payload on Submit", async () => {
    const q = render(<CreateMissingScreen />);
    await fillAllSteps(q);

    await act(async () => { fireEvent.press(q.getByText("Submit")); });

    await waitFor(() => expect(mockCreateReport).toHaveBeenCalledTimes(1));
    expect(mockCreateReport).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Missing: Sarah",
        fullName: "Sarah Johnson",
        personalId: "ID-001",
        contactPhone: "+84 90 000 0000",
        content: "Blonde hair, blue eyes",
      }),
      undefined, // no photo
    );
  });

  it("shows a success alert after the submission resolves", async () => {
    const q = render(<CreateMissingScreen />);
    await fillAllSteps(q);

    await act(async () => { fireEvent.press(q.getByText("Submit")); });

    await waitFor(() =>
      expect(mockShowAlert).toHaveBeenCalledWith(
        "Success",
        "Report submitted",
        "success",
        "OK",
        expect.any(Function),
      ),
    );
  });

  it("navigates back when the success alert OK callback is invoked", async () => {
    const q = render(<CreateMissingScreen />);
    await fillAllSteps(q);

    await act(async () => { fireEvent.press(q.getByText("Submit")); });
    await waitFor(() => expect(mockShowAlert).toHaveBeenCalled());

    // Invoke the OK callback passed to showAlert.
    const okCallback = mockShowAlert.mock.calls[0][4] as () => void;
    act(() => { okCallback(); });

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });
});
