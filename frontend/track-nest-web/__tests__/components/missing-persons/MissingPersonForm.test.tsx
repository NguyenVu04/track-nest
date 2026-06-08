/**
 * Use cases under test:
 *  - FORM-UC-03: A reporter creates a new missing person report.
 *  - FORM-UC-04: A reporter edits an existing missing person report.
 *
 * Dynamic imports (LocationPicker, RichTextEditor) are stubbed via the
 * next/dynamic mock so tests stay free of Leaflet / TinyMCE browser APIs.
 * The Radix UI Select is replaced with a native <select> so options can be
 * driven by standard testing-library / userEvent APIs.
 */

// ── next/dynamic: return null stubs for all dynamically imported components ──
jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => function DynamicStub() { return null; },
}));

// ── Page animation wrapper ────────────────────────────────────────────────────
jest.mock("@/components/animations/PageTransition", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ── Service layer ─────────────────────────────────────────────────────────────
jest.mock("@/services/criminalReportsService", () => ({
  __esModule: true,
  criminalReportsService: {
    submitMissingPersonReport: jest.fn(),
    updateMissingPersonReport: jest.fn(),
    uploadFile: jest.fn(),
    getMissingPersonPhotoUrl: jest.fn(() => "https://example.com/photo.jpg"),
    getFileContent: jest.fn(() => Promise.resolve("https://example.com/photo.jpg")),
  },
}));

// ── Radix UI Select → native <select> for testability ────────────────────────
jest.mock("@/components/ui/select", () => {
  const React = jest.requireActual("react") as typeof import("react");
  return {
    Select: ({
      children,
      value,
      onValueChange,
    }: {
      children: React.ReactNode;
      value: string;
      onValueChange: (v: string) => void;
    }) => (
      <select value={value} onChange={(e) => onValueChange(e.target.value)}>
        {children}
      </select>
    ),
    SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SelectValue: () => null,
    SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SelectItem: ({
      value,
      children,
    }: {
      value: string;
      children: React.ReactNode;
    }) => <option value={value}>{children}</option>,
  };
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MissingPersonForm } from "@/components/missing-persons/MissingPersonForm";
import { criminalReportsService } from "@/services/criminalReportsService";
import type { MissingPerson } from "@/types";

const mockSubmit = criminalReportsService.submitMissingPersonReport as jest.Mock;
const mockUpdate = criminalReportsService.updateMissingPersonReport as jest.Mock;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseResponse = {
  id: "mp-new-001",
  title: "Missing Person: Nguyen Van A",
  fullName: "Nguyen Van A",
  personalId: "001234567890",
  photo: "",
  date: "2026-06-01",
  content: "<div>Physical Description</div>",
  contentDocId: "doc-001",
  latitude: 10.8231,
  longitude: 106.6297,
  contactEmail: "",
  contactPhone: "0901234567",
  createdAt: "2026-06-03T00:00:00Z",
  userId: "user-001",
  status: "PENDING" as const,
  reporterId: "rep-001",
  isPublic: false,
};

const personFixture: MissingPerson = {
  id: "mp-edit-001",
  title: "Missing - Sarah Johnson",
  fullName: "Sarah Johnson",
  personalId: "DL-123456",
  date: "2026-04-12",
  longitude: 106.6,
  latitude: 10.8,
  content: "<div>Physical Description</div>",
  contactPhone: "+84901234567",
  contactEmail: "tip@example.com",
  status: "PENDING",
  reporterId: "rep-1",
  userId: "user-1",
  createdAt: "2026-04-12T00:00:00Z",
  isPublic: false,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderForm(
  mode: "create" | "edit",
  person: MissingPerson | null = null,
  handlers: Partial<{ onSave: jest.Mock; onCancel: jest.Mock }> = {},
) {
  const onSave = handlers.onSave ?? jest.fn();
  const onCancel = handlers.onCancel ?? jest.fn();
  render(
    <MissingPersonForm
      mode={mode}
      person={person}
      onSave={onSave}
      onCancel={onCancel}
    />,
  );
  return { onSave, onCancel };
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/formFullName/i), "Nguyen Van A");
  await user.type(screen.getByLabelText(/formPersonalId/i), "001234567890");
  fireEvent.change(screen.getByLabelText(/formAge/i), { target: { value: "25" } });
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "male" } });
  await user.type(screen.getByLabelText(/formContactPhone/i), "0901234567");
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("MissingPersonForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("FORM-UC-03 — Create missing person report", () => {
    it("renders the create-mode heading and submit button", () => {
      renderForm("create");

      expect(screen.getByText("formNewTitle")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /createButton/i })).toBeInTheDocument();
    });

    it("shows all required-field validation errors when submitting an empty form", async () => {
      const user = userEvent.setup();
      renderForm("create");

      await user.click(screen.getByRole("button", { name: /createButton/i }));

      await waitFor(() => {
        expect(screen.getByText("validation.fullNameMin")).toBeInTheDocument();
        expect(screen.getByText("validation.personalIdRequired")).toBeInTheDocument();
        expect(screen.getByText("validation.ageRequired")).toBeInTheDocument();
        expect(screen.getByText("validation.genderRequired")).toBeInTheDocument();
        expect(screen.getByText("validation.phoneRequired")).toBeInTheDocument();
      });
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it("shows ageRange error when age is 0 (below minimum)", async () => {
      const user = userEvent.setup();
      renderForm("create");

      // type="number" inputs only accept numeric strings; "0" is valid for the
      // DOM but fails the Zod refine (must be ≥ 1).
      fireEvent.change(screen.getByLabelText(/formAge/i), { target: { value: "0" } });
      await user.click(screen.getByRole("button", { name: /createButton/i }));

      await waitFor(() => {
        expect(screen.getByText("validation.ageRange")).toBeInTheDocument();
      });
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it("shows ageRange error when age exceeds 120", async () => {
      const user = userEvent.setup();
      renderForm("create");

      fireEvent.change(screen.getByLabelText(/formAge/i), { target: { value: "150" } });
      await user.click(screen.getByRole("button", { name: /createButton/i }));

      await waitFor(() => {
        expect(screen.getByText("validation.ageRange")).toBeInTheDocument();
      });
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it("calls submitMissingPersonReport and invokes onSave with the API response on valid submit", async () => {
      const user = userEvent.setup();
      mockSubmit.mockResolvedValueOnce(baseResponse);
      const { onSave } = renderForm("create");

      await fillRequiredFields(user);
      await user.click(screen.getByRole("button", { name: /createButton/i }));

      await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "Nguyen Van A",
          personalId: "001234567890",
          contactPhone: "0901234567",
        }),
      );

      await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ id: "mp-new-001", fullName: "Nguyen Van A" }),
      );
    });

    it("shows a toast error and does not call onSave when the service rejects", async () => {
      const user = userEvent.setup();
      const { toast } = jest.requireMock("sonner") as { toast: { error: jest.Mock } };
      mockSubmit.mockRejectedValueOnce(new Error("Network error"));
      const { onSave } = renderForm("create");

      await fillRequiredFields(user);
      await user.click(screen.getByRole("button", { name: /createButton/i }));

      await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe("FORM-UC-04 — Edit missing person report", () => {
    it("renders the edit-mode heading and pre-fills persisted text fields", () => {
      renderForm("edit", personFixture);

      expect(screen.getByText("formEditTitle")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Sarah Johnson")).toBeInTheDocument();
      expect(screen.getByDisplayValue("DL-123456")).toBeInTheDocument();
      expect(screen.getByDisplayValue("+84901234567")).toBeInTheDocument();
      expect(screen.getByDisplayValue("tip@example.com")).toBeInTheDocument();
    });

    it("calls updateMissingPersonReport and invokes onSave on valid submit", async () => {
      const user = userEvent.setup();
      const updateResponse = { ...baseResponse, ...personFixture };
      mockUpdate.mockResolvedValueOnce(updateResponse);
      const { onSave } = renderForm("edit", personFixture);

      // age and gender are not persisted — the form always initialises them to ""
      fireEvent.change(screen.getByLabelText(/formAge/i), { target: { value: "30" } });
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "female" } });

      await user.click(screen.getByRole("button", { name: /^save$/i }));

      await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
      expect(mockUpdate).toHaveBeenCalledWith(
        personFixture.id,
        expect.objectContaining({
          fullName: "Sarah Johnson",
          contactPhone: "+84901234567",
        }),
      );

      await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ id: personFixture.id }),
      );
    });

    it("shows a toast error and does not call onSave when the update service rejects", async () => {
      const user = userEvent.setup();
      const { toast } = jest.requireMock("sonner") as { toast: { error: jest.Mock } };
      mockUpdate.mockRejectedValueOnce(new Error("Server error"));
      const { onSave } = renderForm("edit", personFixture);

      fireEvent.change(screen.getByLabelText(/formAge/i), { target: { value: "30" } });
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "female" } });

      await user.click(screen.getByRole("button", { name: /^save$/i }));

      await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe("Navigation", () => {
    it("calls onCancel when the Back button is clicked", async () => {
      const user = userEvent.setup();
      const { onCancel } = renderForm("create");

      await user.click(screen.getByRole("button", { name: /back/i }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("calls onCancel when the Cancel button is clicked", async () => {
      const user = userEvent.setup();
      const { onCancel } = renderForm("create");

      await user.click(screen.getByRole("button", { name: /cancel/i }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("Optional field validation", () => {
    it("shows heightPositive error for a non-positive height value", async () => {
      const user = userEvent.setup();
      renderForm("create");

      fireEvent.change(screen.getByLabelText(/formHeight/i), { target: { value: "-5" } });
      await user.click(screen.getByRole("button", { name: /createButton/i }));

      await waitFor(() => {
        expect(screen.getByText("validation.heightPositive")).toBeInTheDocument();
      });
    });

    it("shows weightPositive error for a non-positive weight value", async () => {
      const user = userEvent.setup();
      renderForm("create");

      fireEvent.change(screen.getByLabelText(/formWeight/i), { target: { value: "0" } });
      await user.click(screen.getByRole("button", { name: /createButton/i }));

      await waitFor(() => {
        expect(screen.getByText("validation.weightPositive")).toBeInTheDocument();
      });
    });

    it("shows emailInvalid error for a malformed email address", async () => {
      const user = userEvent.setup();
      renderForm("create");

      await user.type(screen.getByLabelText(/formContactEmail/i), "not-an-email");
      await user.click(screen.getByRole("button", { name: /createButton/i }));

      await waitFor(() => {
        expect(screen.getByText("validation.emailInvalid")).toBeInTheDocument();
      });
    });
  });
});
