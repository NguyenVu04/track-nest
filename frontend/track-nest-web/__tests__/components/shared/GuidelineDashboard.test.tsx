/**
 * Use cases under test:
 *  - REPORT-UC-05: A reporter publishes a new crime-prevention guideline document.
 *  - REPORT-UC-06: A reporter deletes an outdated guideline document.
 *
 * Note: jest.mock factories cannot reference out-of-scope vars unless prefixed
 *       `mock*`, so we keep factories pure and grab handles via the imported
 *       service object.
 */

jest.mock("@/services/criminalReportsService", () => ({
  __esModule: true,
  criminalReportsService: {
    listGuidelinesDocuments: jest.fn(),
    createGuidelinesDocument: jest.fn(),
    deleteGuidelinesDocument: jest.fn(),
    deleteDocumentFolder: jest.fn(),
    uploadDocumentFile: jest.fn(),
  },
}));

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GuidelineDashboard } from "@/components/shared/GuidelineDashboard";
import { criminalReportsService } from "@/services/criminalReportsService";

const svc = criminalReportsService as jest.Mocked<typeof criminalReportsService>;

const fixtureGuidelines = [
  {
    id: "gl-001",
    title: "Personal Safety Tips",
    abstractText: "Quick reference for everyday safety.",
    content: "<p>Walk in well-lit areas.</p>",
    contentDocId: "doc-1",
    createdAt: "2026-04-01T00:00:00Z",
    reporterId: "rep-1",
    isPublic: false,
  },
];

const reporter = {
  id: "rep-1",
  email: "rep@example.com",
  fullName: "Reporter One",
  role: ["Reporter"] as const,
};

beforeEach(() => {
  jest.clearAllMocks();
  svc.listGuidelinesDocuments.mockResolvedValue({
    content: fixtureGuidelines,
  } as Awaited<ReturnType<typeof svc.listGuidelinesDocuments>>);
});

describe("GuidelineDashboard", () => {
  describe("REPORT-UC-05 — Publish Guideline Document", () => {
    it("submits a new guideline through the service when the form is filled", async () => {
      const user = userEvent.setup();
      svc.createGuidelinesDocument.mockResolvedValue({
        ...fixtureGuidelines[0],
        id: "gl-new",
        title: "New Guideline",
      });
      // First call returns the seed; second returns the seed + new entry.
      svc.listGuidelinesDocuments
        .mockResolvedValueOnce({ content: fixtureGuidelines } as Awaited<
          ReturnType<typeof svc.listGuidelinesDocuments>
        >)
        .mockResolvedValueOnce({
          content: [
            {
              ...fixtureGuidelines[0],
              id: "gl-new",
              title: "New Guideline",
              abstractText: "Brand new abstract",
            },
          ],
        } as Awaited<ReturnType<typeof svc.listGuidelinesDocuments>>);

      render(<GuidelineDashboard user={{ ...reporter, role: ["Reporter"] }} />);

      await waitFor(() =>
        expect(screen.getByText("Personal Safety Tips")).toBeInTheDocument(),
      );

      await user.click(screen.getByRole("button", { name: /New Guideline/i }));

      await user.type(screen.getByLabelText(/Title/i), "New Guideline");
      await user.type(screen.getByLabelText(/Abstract/i), "Brand new abstract");
      await user.type(
        screen.getByLabelText(/Content/i),
        "Stay alert and follow safety tips.",
      );

      await user.click(
        screen.getByRole("button", { name: /Publish Guideline/i }),
      );

      await waitFor(() =>
        expect(svc.createGuidelinesDocument).toHaveBeenCalledTimes(1),
      );
      expect(svc.createGuidelinesDocument).toHaveBeenCalledWith({
        title: "New Guideline",
        abstractText: "Brand new abstract",
        content: "Stay alert and follow safety tips.",
        isPublic: false,
      });
      expect(svc.uploadDocumentFile).not.toHaveBeenCalled();
    });

    it("hides the New Guideline button for users without management permission", async () => {
      render(
        <GuidelineDashboard
          user={{ ...reporter, role: ["Emergency Service"] }}
        />,
      );
      await waitFor(() =>
        expect(screen.getByText("Personal Safety Tips")).toBeInTheDocument(),
      );
      expect(
        screen.queryByRole("button", { name: /New Guideline/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("REPORT-UC-06 — Delete Guideline Document", () => {
    it("calls the delete + cleanup endpoints after the reporter confirms", async () => {
      const user = userEvent.setup();
      svc.deleteGuidelinesDocument.mockResolvedValue(
        undefined as unknown as Awaited<
          ReturnType<typeof svc.deleteGuidelinesDocument>
        >,
      );
      svc.deleteDocumentFolder.mockResolvedValue(
        undefined as unknown as Awaited<
          ReturnType<typeof svc.deleteDocumentFolder>
        >,
      );
      svc.listGuidelinesDocuments
        .mockResolvedValueOnce({ content: fixtureGuidelines } as Awaited<
          ReturnType<typeof svc.listGuidelinesDocuments>
        >)
        .mockResolvedValueOnce({ content: [] } as Awaited<
          ReturnType<typeof svc.listGuidelinesDocuments>
        >);

      render(<GuidelineDashboard user={{ ...reporter, role: ["Reporter"] }} />);
      const card = await screen.findByText("Personal Safety Tips");
      const cardEl = card.closest("div.bg-white") as HTMLElement;
      const deleteBtn = within(cardEl).getByTitle("Delete Guideline");
      await user.click(deleteBtn);

      // ConfirmModal opens.
      expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Delete" }));

      await waitFor(() =>
        expect(svc.deleteGuidelinesDocument).toHaveBeenCalledWith("gl-001"),
      );
      expect(svc.deleteDocumentFolder).toHaveBeenCalledWith("gl-001");
    });

    it("does NOT call delete services when the reporter cancels", async () => {
      const user = userEvent.setup();
      render(<GuidelineDashboard user={{ ...reporter, role: ["Reporter"] }} />);
      const card = await screen.findByText("Personal Safety Tips");
      const cardEl = card.closest("div.bg-white") as HTMLElement;

      await user.click(within(cardEl).getByTitle("Delete Guideline"));
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(svc.deleteGuidelinesDocument).not.toHaveBeenCalled();
      expect(svc.deleteDocumentFolder).not.toHaveBeenCalled();
    });
  });
});
