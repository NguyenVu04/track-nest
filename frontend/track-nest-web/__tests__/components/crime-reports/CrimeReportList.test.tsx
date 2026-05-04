import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CrimeReportList } from "@/components/crime-reports/CrimeReportList";
import type { CrimeReport, UserRole } from "@/types";

/**
 * Use cases under test:
 *  - REPORT-UC-09: A reporter publishes a crime report.
 *  - REPORT-UC-10: A reporter deletes a crime report.
 */

const baseFixture: CrimeReport = {
  id: "cr-001",
  title: "Pickpocket near Ben Thanh",
  content: "Tourist reported wallet snatched at busy market entrance.",
  severity: 3,
  date: "2026-04-22",
  longitude: 106.6,
  latitude: 10.8,
  numberOfVictims: 1,
  numberOfOffenders: 1,
  arrested: false,
  createdAt: "2026-04-22T00:00:00Z",
  updatedAt: "2026-04-22T00:00:00Z",
  reporterId: "rep-1",
  isPublic: false,
};

function renderWith(
  overrides: Partial<CrimeReport> = {},
  role: UserRole[] = ["Reporter"],
) {
  const onPublish = jest.fn();
  const onDelete = jest.fn();
  const onViewDetail = jest.fn();
  render(
    <CrimeReportList
      reports={[{ ...baseFixture, ...overrides }]}
      onPublish={onPublish}
      onDelete={onDelete}
      onViewDetail={onViewDetail}
      userRole={role}
    />,
  );
  return { onPublish, onDelete, onViewDetail };
}

describe("CrimeReportList", () => {
  describe("REPORT-UC-09 — Publish Crime Report", () => {
    it("renders the publish action only when the report is not yet public", () => {
      renderWith();
      expect(screen.getByTitle("publish")).toBeInTheDocument();
    });

    it("hides the publish action once a report is public", () => {
      renderWith({ isPublic: true });
      expect(screen.queryByTitle("publish")).not.toBeInTheDocument();
      expect(screen.getByTitle("delete")).toBeInTheDocument();
    });

    it("calls onPublish with the report id after the reporter confirms", async () => {
      const user = userEvent.setup();
      const { onPublish, onDelete } = renderWith();

      await user.click(screen.getByTitle("publish"));

      // Confirm dialog title comes from t("publishTitle") which our mock returns as the key.
      expect(screen.getByText("publishTitle")).toBeInTheDocument();

      await user.click(screen.getByText("publish", { selector: "button" }));

      expect(onPublish).toHaveBeenCalledTimes(1);
      expect(onPublish).toHaveBeenCalledWith(baseFixture.id);
      expect(onDelete).not.toHaveBeenCalled();
      // Modal is dismissed after confirm.
      expect(screen.queryByText("publishTitle")).not.toBeInTheDocument();
    });

    it("does NOT call onPublish if the reporter cancels", async () => {
      const user = userEvent.setup();
      const { onPublish } = renderWith();

      await user.click(screen.getByTitle("publish"));
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(onPublish).not.toHaveBeenCalled();
    });
  });

  describe("REPORT-UC-10 — Delete Crime Report", () => {
    it("calls onDelete with the report id when the reporter confirms", async () => {
      const user = userEvent.setup();
      const { onDelete, onPublish } = renderWith();

      await user.click(screen.getByTitle("delete"));
      expect(screen.getByText("deleteTitle")).toBeInTheDocument();

      await user.click(screen.getByText("delete", { selector: "button" }));

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith(baseFixture.id);
      expect(onPublish).not.toHaveBeenCalled();
    });

    it("does NOT call onDelete if the reporter cancels", async () => {
      const user = userEvent.setup();
      const { onDelete } = renderWith();

      await user.click(screen.getByTitle("delete"));
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(onDelete).not.toHaveBeenCalled();
    });
  });

  describe("Role gating", () => {
    it("hides publish AND delete for an Emergency Service viewer", () => {
      renderWith({}, ["Emergency Service"]);
      expect(screen.queryByTitle("publish")).not.toBeInTheDocument();
      expect(screen.queryByTitle("delete")).not.toBeInTheDocument();
      // View detail remains.
      expect(screen.getByTitle("viewDetails")).toBeInTheDocument();
    });
  });

  describe("View detail", () => {
    it("invokes onViewDetail with the row's report when clicking the eye icon", async () => {
      const user = userEvent.setup();
      const { onViewDetail } = renderWith();

      const row = screen.getByText(baseFixture.title).closest("tr");
      expect(row).not.toBeNull();
      const viewBtn = within(row as HTMLElement).getByTitle("viewDetails");

      await user.click(viewBtn);
      expect(onViewDetail).toHaveBeenCalledWith(
        expect.objectContaining({ id: "cr-001" }),
      );
    });
  });

  describe("Empty state", () => {
    it("renders the empty state when there are no reports", () => {
      render(
        <CrimeReportList
          reports={[]}
          onPublish={jest.fn()}
          onDelete={jest.fn()}
          onViewDetail={jest.fn()}
          userRole={["Reporter"]}
        />,
      );
      expect(screen.getByText("emptyTitle")).toBeInTheDocument();
    });
  });
});
