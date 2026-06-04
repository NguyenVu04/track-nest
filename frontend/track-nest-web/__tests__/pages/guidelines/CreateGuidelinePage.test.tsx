/**
 * Use cases under test:
 *  - PAGE-UC-01: An unauthenticated user sees the unauthorized screen.
 *  - PAGE-UC-02: An authenticated user sees the create form with correct layout.
 *  - PAGE-UC-03: "Save as Draft" validates title, then creates a private draft.
 *  - PAGE-UC-04: "Publish" validates abstract + content, then creates & publishes.
 *  - PAGE-UC-05: Service errors surface as toast errors.
 *  - PAGE-UC-06: Visibility toggle gates which action button is active.
 *
 * The two-action form pattern:
 *   - "Save as Draft" → handleSubmit(onSaveDraft). Zod validates title only.
 *     Calls createGuidelinesDocument({ isPublic: false }). No publish step.
 *   - "Publish" → handleSubmit(onPublish). Zod validates title first. Then
 *     onPublish manually validates abstractText + content via setError(). If
 *     valid, calls createGuidelinesDocument then publishGuidelinesDocument.
 *
 * Translation keys are asserted as-is because the global next-intl mock
 * returns the key string (e.g. t("validation.titleRequired") → "validation.titleRequired").
 */

// ── next/dynamic: make RichTextEditor interactive via a stub textarea ─────────
jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () =>
    function RichTextEditorStub({
      onChange,
    }: {
      value: string;
      onChange: (v: string) => void;
    }) {
      return (
        <textarea
          aria-label="content-editor"
          onChange={(e) => onChange(e.target.value)}
        />
      );
    },
}));

// ── Stable router references (mock* prefix required for jest.mock hoisting) ──
const mockRouterPush = jest.fn();
const mockRouterBack = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    back: mockRouterBack,
    replace: jest.fn(),
    prefetch: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// ── Page wrappers ─────────────────────────────────────────────────────────────
jest.mock("@/components/animations/PageTransition", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock("@/components/layout/Breadcrumbs", () => ({
  Breadcrumbs: () => null,
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

// ── Radix UI Switch → native button with role=switch ─────────────────────────
jest.mock("@/components/ui/switch", () => ({
  Switch: ({
    checked,
    onCheckedChange,
  }: {
    checked: boolean;
    onCheckedChange: (v: boolean) => void;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
    />
  ),
}));

// ── Auth context ──────────────────────────────────────────────────────────────
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// ── Service layer ─────────────────────────────────────────────────────────────
jest.mock("@/services/criminalReportsService", () => ({
  __esModule: true,
  criminalReportsService: {
    createGuidelinesDocument: jest.fn(),
    publishGuidelinesDocument: jest.fn(),
  },
}));

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateGuidelinePage from "@/app/dashboard/guidelines/create/page";
import { useAuth } from "@/contexts/AuthContext";
import { criminalReportsService } from "@/services/criminalReportsService";

const mockUseAuth = useAuth as jest.Mock;
const mockCreate = criminalReportsService.createGuidelinesDocument as jest.Mock;
const mockPublish = criminalReportsService.publishGuidelinesDocument as jest.Mock;

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPage() {
  render(<CreateGuidelinePage />);
}

async function fillTitle(user: ReturnType<typeof userEvent.setup>, title = "Extreme Weather Protocol") {
  await user.type(screen.getByLabelText("formGuidelineTitle"), title);
}

async function fillAbstract(user: ReturnType<typeof userEvent.setup>, text = "Abstract text") {
  await user.type(screen.getByLabelText("formAbstract"), text);
}

async function togglePublic(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("switch"));
}

function fillContent(text = "Full content body") {
  fireEvent.change(screen.getByLabelText("content-editor"), {
    target: { value: text },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("CreateGuidelinePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: authenticated user
    mockUseAuth.mockReturnValue({ user: { id: "user-1", name: "Admin" } });
  });

  // ── PAGE-UC-01: Unauthenticated ─────────────────────────────────────────────

  describe("PAGE-UC-01 — Unauthenticated user", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: null });
    });

    it("renders the unauthorized screen instead of the form", () => {
      renderPage();

      expect(screen.getByText("unauthorizedTitle")).toBeInTheDocument();
      expect(screen.getByText("unauthorizedMessage")).toBeInTheDocument();
      expect(screen.queryByLabelText("formGuidelineTitle")).not.toBeInTheDocument();
    });

    it("calls router.back() when the Back button is clicked", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole("button", { name: /^back$/i }));

      expect(mockRouterBack).toHaveBeenCalledTimes(1);
    });
  });

  // ── PAGE-UC-02: Form layout ─────────────────────────────────────────────────

  describe("PAGE-UC-02 — Form layout for authenticated user", () => {
    it("renders the page heading and key form fields", () => {
      renderPage();

      expect(screen.getByText("createHeading")).toBeInTheDocument();
      expect(screen.getByLabelText("formGuidelineTitle")).toBeInTheDocument();
      expect(screen.getByLabelText("formAbstract")).toBeInTheDocument();
      expect(screen.getByLabelText("content-editor")).toBeInTheDocument();
    });

    it("Save as Draft button is enabled and Publish button is disabled by default", () => {
      renderPage();

      expect(screen.getByRole("button", { name: /saveDraftButton/i })).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /^publish$/i })).toBeDisabled();
    });
  });

  // ── PAGE-UC-06: Visibility toggle ──────────────────────────────────────────

  describe("PAGE-UC-06 — Visibility toggle gates action buttons", () => {
    it("toggling the switch to Public disables Save as Draft and enables Publish", async () => {
      const user = userEvent.setup();
      renderPage();

      await togglePublic(user);

      expect(screen.getByRole("button", { name: /saveDraftButton/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /^publish$/i })).not.toBeDisabled();
    });

    it("toggling the switch back to Draft re-enables Save as Draft and disables Publish", async () => {
      const user = userEvent.setup();
      renderPage();

      await togglePublic(user); // → Public
      await togglePublic(user); // → Draft

      expect(screen.getByRole("button", { name: /saveDraftButton/i })).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /^publish$/i })).toBeDisabled();
    });
  });

  // ── PAGE-UC-03: Save as Draft ───────────────────────────────────────────────

  describe("PAGE-UC-03 — Save as Draft", () => {
    it("shows titleRequired validation error and does not call the service when title is empty", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole("button", { name: /saveDraftButton/i }));

      await waitFor(() => {
        expect(screen.getByText("validation.titleRequired")).toBeInTheDocument();
      });
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("calls createGuidelinesDocument with isPublic=false, shows toast and navigates on success", async () => {
      const user = userEvent.setup();
      mockCreate.mockResolvedValueOnce({ id: "gd-001", title: "Extreme Weather Protocol" });
      renderPage();

      await fillTitle(user);
      await user.click(screen.getByRole("button", { name: /saveDraftButton/i }));

      await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Extreme Weather Protocol",
          isPublic: false,
        }),
      );
      expect(mockPublish).not.toHaveBeenCalled();

      const { toast } = jest.requireMock("sonner") as { toast: { success: jest.Mock } };
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith("toastDraftSaved"));
      expect(mockRouterPush).toHaveBeenCalledWith("/dashboard/guidelines");
    });
  });

  // ── PAGE-UC-05: Save as Draft — service error ───────────────────────────────

  describe("PAGE-UC-05 — Save as Draft service error", () => {
    it("shows toastSaveError and does not navigate when createGuidelinesDocument rejects", async () => {
      const user = userEvent.setup();
      const { toast } = jest.requireMock("sonner") as { toast: { error: jest.Mock } };
      mockCreate.mockRejectedValueOnce(new Error("Network error"));
      renderPage();

      await fillTitle(user);
      await user.click(screen.getByRole("button", { name: /saveDraftButton/i }));

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("toastSaveError"));
      expect(mockRouterPush).not.toHaveBeenCalled();
    });
  });

  // ── PAGE-UC-04: Publish — validation ───────────────────────────────────────

  describe("PAGE-UC-04 — Publish validation", () => {
    it("shows abstractRequired error when abstract is empty and blocks the publish call", async () => {
      const user = userEvent.setup();
      renderPage();

      await fillTitle(user);
      await togglePublic(user);
      await user.click(screen.getByRole("button", { name: /^publish$/i }));

      await waitFor(() => {
        expect(screen.getByText("validation.abstractRequired")).toBeInTheDocument();
      });
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("shows contentRequired error when abstract is filled but content is empty", async () => {
      const user = userEvent.setup();
      renderPage();

      await fillTitle(user);
      await fillAbstract(user);
      await togglePublic(user);
      // content stays "" (RichTextEditor onChange not fired)
      await user.click(screen.getByRole("button", { name: /^publish$/i }));

      await waitFor(() => {
        expect(screen.getByText("validation.contentRequired")).toBeInTheDocument();
      });
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  // ── PAGE-UC-04: Publish — happy path ───────────────────────────────────────

  describe("PAGE-UC-04 — Publish happy path", () => {
    it("calls createGuidelinesDocument then publishGuidelinesDocument and navigates", async () => {
      const user = userEvent.setup();
      const { toast } = jest.requireMock("sonner") as { toast: { success: jest.Mock } };
      mockCreate.mockResolvedValueOnce({ id: "gd-002", title: "Extreme Weather Protocol" });
      mockPublish.mockResolvedValueOnce(undefined);
      renderPage();

      await fillTitle(user);
      await fillAbstract(user);
      fillContent("Full procedure content");
      await togglePublic(user);
      await user.click(screen.getByRole("button", { name: /^publish$/i }));

      await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Extreme Weather Protocol",
          isPublic: true,
        }),
      );

      await waitFor(() => expect(mockPublish).toHaveBeenCalledTimes(1));
      expect(mockPublish).toHaveBeenCalledWith("gd-002");

      await waitFor(() => expect(toast.success).toHaveBeenCalledWith("toastPublished"));
      expect(mockRouterPush).toHaveBeenCalledWith("/dashboard/guidelines");
    });
  });

  // ── PAGE-UC-05: Publish — service error ────────────────────────────────────

  describe("PAGE-UC-05 — Publish service error", () => {
    it("shows toastPublishError and does not navigate when the service rejects", async () => {
      const user = userEvent.setup();
      const { toast } = jest.requireMock("sonner") as { toast: { error: jest.Mock } };
      mockCreate.mockRejectedValueOnce(new Error("Server error"));
      renderPage();

      await fillTitle(user);
      await fillAbstract(user);
      fillContent("Content");
      await togglePublic(user);
      await user.click(screen.getByRole("button", { name: /^publish$/i }));

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("toastPublishError"));
      expect(mockRouterPush).not.toHaveBeenCalled();
    });
  });

  // ── Navigation ──────────────────────────────────────────────────────────────

  describe("Navigation", () => {
    it("calls router.back() when Cancel is clicked", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole("button", { name: /^cancel$/i }));

      expect(mockRouterBack).toHaveBeenCalledTimes(1);
    });
  });
});
