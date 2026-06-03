/**
 * Use cases under test:
 *  - FORM-UC-01: A reporter creates a new crime report (two-step: validate → review → confirm).
 *  - FORM-UC-02: A reporter edits an existing crime report (two-step; edit calls onSave directly,
 *                no update API endpoint — the parent handles persistence).
 *
 * The two-step submit flow is the key behaviour unique to CrimeReportForm:
 *   1. Clicking the submit button runs react-hook-form validation. If valid, it opens
 *      a read-only review modal (submittedData snapshot is stored in state).
 *   2. The reporter reviews and clicks "Confirm". Only then is the service called.
 *
 * Dynamic imports (LocationPicker, RichTextEditor) are stubbed via the
 * next/dynamic mock so tests stay free of Leaflet / TinyMCE browser APIs.
 */

// ── next/dynamic: stub all dynamically imported components ───────────────────
jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => function DynamicStub() { return null; },
}));

// ── sonner: extend the global setup mock to also cover toast.warning ─────────
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    message: jest.fn(),
  },
  Toaster: () => null,
}));

// ── Service layer ─────────────────────────────────────────────────────────────
jest.mock("@/services/criminalReportsService", () => ({
  __esModule: true,
  criminalReportsService: {
    submitCrimeReport: jest.fn(),
    uploadFile: jest.fn(),
  },
}));

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CrimeReportForm } from "@/components/crime-reports/CrimeReportForm";
import { criminalReportsService } from "@/services/criminalReportsService";
import type { CrimeReport } from "@/types";

const mockSubmitCrimeReport = criminalReportsService.submitCrimeReport as jest.Mock;
const mockUploadFile = criminalReportsService.uploadFile as jest.Mock;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseCreateResponse = {
  id: "cr-new-001",
  title: "Pickpocket near the market",
  content: "",
  severity: 3,
  date: "2026-06-01",
  longitude: 106.7009,
  latitude: 10.7769,
  numberOfVictims: 0,
  numberOfOffenders: 0,
  arrested: false,
  photos: [],
  createdAt: "2026-06-03T00:00:00Z",
  updatedAt: "2026-06-03T00:00:00Z",
  reporterId: "rep-001",
  isPublic: false,
};

const reportFixture: CrimeReport = {
  id: "cr-edit-001",
  title: "Street robbery at District 1",
  content: "<p>Incident details.</p>",
  severity: 5,
  date: "2026-05-15T14:30:00.000Z",
  longitude: 106.6,
  latitude: 10.8,
  numberOfVictims: 2,
  numberOfOffenders: 1,
  arrested: true,
  createdAt: "2026-05-15T00:00:00Z",
  updatedAt: "2026-05-15T00:00:00Z",
  reporterId: "rep-1",
  isPublic: false,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderForm(
  mode: "create" | "edit",
  report: CrimeReport | null = null,
  handlers: Partial<{ onSave: jest.Mock; onCancel: jest.Mock }> = {},
) {
  const onSave = handlers.onSave ?? jest.fn();
  const onCancel = handlers.onCancel ?? jest.fn();
  render(
    <CrimeReportForm
      mode={mode}
      report={report}
      onSave={onSave}
      onCancel={onCancel}
    />,
  );
  return { onSave, onCancel };
}

/** Fill the title field and submit the form (step 1 of the two-step flow). */
async function submitValidForm(user: ReturnType<typeof userEvent.setup>, title = "Pickpocket near the market") {
  await user.type(screen.getByLabelText(/formTitle/i), title);
  await user.click(screen.getByRole("button", { name: /submitReport/i }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("CrimeReportForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("FORM-UC-01 — Create crime report", () => {
    it("renders the create-mode heading and submit button", () => {
      renderForm("create");

      expect(screen.getByText("formNewTitle")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /submitReport/i })).toBeInTheDocument();
    });

    it("shows titleRequired error and does not open the review modal when title is empty", async () => {
      const user = userEvent.setup();
      renderForm("create");

      await user.click(screen.getByRole("button", { name: /submitReport/i }));

      await waitFor(() => {
        expect(screen.getByText("validation.titleRequired")).toBeInTheDocument();
      });
      expect(screen.queryByText("reviewTitle")).not.toBeInTheDocument();
      expect(mockSubmitCrimeReport).not.toHaveBeenCalled();
    });

    it("opens the review modal with the report summary after a valid form submit", async () => {
      const user = userEvent.setup();
      renderForm("create");

      await submitValidForm(user);

      await waitFor(() => {
        expect(screen.getByText("reviewTitle")).toBeInTheDocument();
      });
      // The review shows the entered title.
      expect(screen.getAllByText("Pickpocket near the market").length).toBeGreaterThanOrEqual(1);
      // The confirm button is visible.
      expect(screen.getByRole("button", { name: /confirmSubmit/i })).toBeInTheDocument();
    });

    it("closes the review modal without calling the service when Back to Edit is clicked", async () => {
      const user = userEvent.setup();
      renderForm("create");

      await submitValidForm(user);
      await waitFor(() => expect(screen.getByText("reviewTitle")).toBeInTheDocument());

      await user.click(screen.getByRole("button", { name: /backToEdit/i }));

      expect(screen.queryByText("reviewTitle")).not.toBeInTheDocument();
      expect(mockSubmitCrimeReport).not.toHaveBeenCalled();
    });

    it("calls submitCrimeReport and onSave after the reporter confirms in the review modal", async () => {
      const user = userEvent.setup();
      mockSubmitCrimeReport.mockResolvedValueOnce(baseCreateResponse);
      const { onSave } = renderForm("create");

      await submitValidForm(user);
      await waitFor(() => expect(screen.getByText("reviewTitle")).toBeInTheDocument());

      await user.click(screen.getByRole("button", { name: /confirmSubmit/i }));

      await waitFor(() => expect(mockSubmitCrimeReport).toHaveBeenCalledTimes(1));
      expect(mockSubmitCrimeReport).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Pickpocket near the market",
          severity: 3, // default severity
          arrested: false, // default
        }),
      );

      await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ id: "cr-new-001", title: "Pickpocket near the market" }),
      );
    });

    it("shows a toast error and does not call onSave when the service rejects", async () => {
      const user = userEvent.setup();
      const { toast } = jest.requireMock("sonner") as { toast: { error: jest.Mock } };
      mockSubmitCrimeReport.mockRejectedValueOnce(new Error("Network error"));
      const { onSave } = renderForm("create");

      await submitValidForm(user);
      await waitFor(() => expect(screen.getByText("reviewTitle")).toBeInTheDocument());

      await user.click(screen.getByRole("button", { name: /confirmSubmit/i }));

      await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe("FORM-UC-02 — Edit crime report", () => {
    it("renders the edit-mode heading and pre-fills the title from the existing report", () => {
      renderForm("edit", reportFixture);

      expect(screen.getByText("formEditTitle")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Street robbery at District 1")).toBeInTheDocument();
    });

    it("calls onSave directly (no update API) after confirming in the review modal", async () => {
      const user = userEvent.setup();
      const { onSave } = renderForm("edit", reportFixture);

      // The form is pre-filled — submit immediately (title is valid).
      await user.click(screen.getByRole("button", { name: /updateReport/i }));
      await waitFor(() => expect(screen.getByText("reviewTitle")).toBeInTheDocument());

      await user.click(screen.getByRole("button", { name: /confirmSubmit/i }));

      await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: reportFixture.id,
          title: "Street robbery at District 1",
        }),
      );
      // Edit mode does not call the submit endpoint — the parent handles persistence.
      expect(mockSubmitCrimeReport).not.toHaveBeenCalled();
      expect(mockUploadFile).not.toHaveBeenCalled();
    });

    it("shows a toast error and does not call onSave when onSave rejects in edit mode", async () => {
      const user = userEvent.setup();
      const { toast } = jest.requireMock("sonner") as { toast: { error: jest.Mock } };
      const onSave = jest.fn().mockRejectedValueOnce(new Error("Save failed"));
      renderForm("edit", reportFixture, { onSave });

      await user.click(screen.getByRole("button", { name: /updateReport/i }));
      await waitFor(() => expect(screen.getByText("reviewTitle")).toBeInTheDocument());

      await user.click(screen.getByRole("button", { name: /confirmSubmit/i }));

      await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    });
  });

  describe("Severity selection", () => {
    it("reflects the selected severity in the review modal and the API call", async () => {
      const user = userEvent.setup();
      mockSubmitCrimeReport.mockResolvedValueOnce({ ...baseCreateResponse, severity: 5 });
      const { onSave } = renderForm("create");

      // Click the High severity button (value=5, label key "severityOpt5").
      await user.click(screen.getByRole("button", { name: /severityOpt5/i }));
      await submitValidForm(user);
      await waitFor(() => expect(screen.getByText("reviewTitle")).toBeInTheDocument());

      await user.click(screen.getByRole("button", { name: /confirmSubmit/i }));

      await waitFor(() => expect(mockSubmitCrimeReport).toHaveBeenCalledTimes(1));
      expect(mockSubmitCrimeReport).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 5 }),
      );
      await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    });
  });

  describe("Arrested toggle", () => {
    it("reflects the arrested state in the API call when the toggle is activated", async () => {
      const user = userEvent.setup();
      mockSubmitCrimeReport.mockResolvedValueOnce({ ...baseCreateResponse, arrested: true });
      const { onSave } = renderForm("create");

      // The arrested toggle button text switches between t("formArrestedNo") and t("formArrestedYes").
      // Default is "Not Arrested" (formArrestedNo). Clicking it toggles to true.
      await user.click(screen.getByRole("button", { name: /formArrestedNo/i }));
      await submitValidForm(user);
      await waitFor(() => expect(screen.getByText("reviewTitle")).toBeInTheDocument());

      await user.click(screen.getByRole("button", { name: /confirmSubmit/i }));

      await waitFor(() => expect(mockSubmitCrimeReport).toHaveBeenCalledTimes(1));
      expect(mockSubmitCrimeReport).toHaveBeenCalledWith(
        expect.objectContaining({ arrested: true }),
      );
      await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    });
  });

  describe("Numeric field validation", () => {
    it("shows victimsNonNegative error for a negative numberOfVictims and blocks review modal", async () => {
      const user = userEvent.setup();
      renderForm("create");

      await user.type(screen.getByLabelText(/formTitle/i), "Test report");
      fireEvent.change(screen.getByLabelText(/formVictims/i), { target: { value: "-1" } });
      await user.click(screen.getByRole("button", { name: /submitReport/i }));

      await waitFor(() => {
        expect(screen.getByText("validation.victimsNonNegative")).toBeInTheDocument();
      });
      expect(screen.queryByText("reviewTitle")).not.toBeInTheDocument();
      expect(mockSubmitCrimeReport).not.toHaveBeenCalled();
    });

    it("shows offendersNonNegative error for a negative numberOfOffenders and blocks review modal", async () => {
      const user = userEvent.setup();
      renderForm("create");

      await user.type(screen.getByLabelText(/formTitle/i), "Test report");
      fireEvent.change(screen.getByLabelText(/formOffenders/i), { target: { value: "-1" } });
      await user.click(screen.getByRole("button", { name: /submitReport/i }));

      await waitFor(() => {
        expect(screen.getByText("validation.offendersNonNegative")).toBeInTheDocument();
      });
      expect(screen.queryByText("reviewTitle")).not.toBeInTheDocument();
      expect(mockSubmitCrimeReport).not.toHaveBeenCalled();
    });
  });

  describe("Navigation", () => {
    it("calls onCancel when the Cancel button is clicked", async () => {
      const user = userEvent.setup();
      const { onCancel } = renderForm("create");

      await user.click(screen.getByRole("button", { name: /^cancel$/i }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });
});
