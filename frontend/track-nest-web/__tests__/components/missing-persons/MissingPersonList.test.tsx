import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MissingPersonList } from "@/components/missing-persons/MissingPersonList";
import type { MissingPerson, UserRole } from "@/types";

/**
 * Use cases under test:
 *  - REPORT-UC-01: A reporter publishes a missing person report.
 *  - REPORT-UC-02: A reporter deletes a missing person report.
 */

const baseFixture: MissingPerson = {
  id: "mp-001",
  title: "Missing - Sarah Johnson",
  fullName: "Sarah Johnson",
  personalId: "DL-123456",
  date: "2026-04-12",
  longitude: 106.6,
  latitude: 10.8,
  content: "Last seen near the central market wearing a red jacket.",
  contactPhone: "+84 90 000 0000",
  contactEmail: "tip@example.com",
  status: "PENDING",
  reporterId: "rep-1",
  userId: "user-1",
  createdAt: "2026-04-12T00:00:00Z",
  isPublic: false,
};

function renderWith(
  overrides: Partial<MissingPerson> = {},
  role: UserRole[] = ["Reporter"],
  handlers?: Partial<{
    onPublish: jest.Mock;
    onDelete: jest.Mock;
    onViewDetail: jest.Mock;
  }>,
) {
  const onPublish = handlers?.onPublish ?? jest.fn();
  const onDelete = handlers?.onDelete ?? jest.fn();
  const onViewDetail = handlers?.onViewDetail ?? jest.fn();
  render(
    <MissingPersonList
      persons={[{ ...baseFixture, ...overrides }]}
      onPublish={onPublish}
      onDelete={onDelete}
      onViewDetail={onViewDetail}
      userRole={role}
    />,
  );
  return { onPublish, onDelete, onViewDetail };
}

describe("MissingPersonList", () => {
  describe("REPORT-UC-01 — Publish Missing Person Report", () => {
    it("opens the confirm dialog and calls onPublish when a Reporter confirms", async () => {
      const user = userEvent.setup();
      const { onPublish, onDelete } = renderWith();

      // Reporter row exposes a publish action while status is PENDING.
      const publishButton = screen.getByTitle("publish");
      await user.click(publishButton);

      // Confirm modal renders; using the i18n mock keys.
      expect(screen.getByText("publishTitle")).toBeInTheDocument();
      expect(
        screen.getByText(
          `publishMessage:${JSON.stringify({ title: baseFixture.title })}`,
        ),
      ).toBeInTheDocument();

      // Modal's confirm button is the *text* element; the row icon button
      // shares the same accessible name via its title attribute, so we query
      // by text content to disambiguate.
      const confirmBtn = screen.getByText("publish", { selector: "button" });
      await user.click(confirmBtn);

      expect(onPublish).toHaveBeenCalledTimes(1);
      expect(onPublish).toHaveBeenCalledWith(baseFixture.id);
      expect(onDelete).not.toHaveBeenCalled();

      // Modal closes after confirm.
      expect(screen.queryByText("publishTitle")).not.toBeInTheDocument();
    });

    it("does not call onPublish when the user cancels the confirm dialog", async () => {
      const user = userEvent.setup();
      const { onPublish } = renderWith();

      await user.click(screen.getByTitle("publish"));
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(onPublish).not.toHaveBeenCalled();
      expect(screen.queryByText("publishTitle")).not.toBeInTheDocument();
    });

    it("hides the publish action when the report is no longer PENDING", () => {
      renderWith({ status: "PUBLISHED" });
      expect(screen.queryByTitle("publish")).not.toBeInTheDocument();
      // Delete remains available for cleanup.
      expect(screen.getByTitle("delete")).toBeInTheDocument();
    });

    it("hides the publish action for a non-Reporter / non-User role (e.g. Emergency Service)", () => {
      renderWith({}, ["Emergency Service"]);
      expect(screen.queryByTitle("publish")).not.toBeInTheDocument();
      expect(screen.queryByTitle("delete")).not.toBeInTheDocument();
      // View detail is always available.
      expect(screen.getByTitle("viewDetails")).toBeInTheDocument();
    });
  });

  describe("REPORT-UC-02 — Delete Missing Person Report", () => {
    it("opens the confirm dialog and calls onDelete when a Reporter confirms", async () => {
      const user = userEvent.setup();
      const { onDelete, onPublish } = renderWith();

      await user.click(screen.getByTitle("delete"));

      expect(screen.getByText("deleteTitle")).toBeInTheDocument();
      const confirmBtn = screen.getByText("delete", { selector: "button" });
      await user.click(confirmBtn);

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith(baseFixture.id);
      expect(onPublish).not.toHaveBeenCalled();
    });

    it("does not call onDelete when the user cancels", async () => {
      const user = userEvent.setup();
      const { onDelete } = renderWith();

      await user.click(screen.getByTitle("delete"));
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(onDelete).not.toHaveBeenCalled();
    });
  });

  describe("Empty state", () => {
    it("renders the empty state when there are no persons", () => {
      const onPublish = jest.fn();
      const onDelete = jest.fn();
      render(
        <MissingPersonList
          persons={[]}
          onPublish={onPublish}
          onDelete={onDelete}
          onViewDetail={jest.fn()}
          userRole={["Reporter"]}
        />,
      );
      // i18n mock returns keys.
      expect(screen.getByText("emptyTitle")).toBeInTheDocument();
      expect(screen.getByText("emptyDescription")).toBeInTheDocument();
    });
  });

  describe("View detail", () => {
    it("invokes onViewDetail with the row's person", async () => {
      const user = userEvent.setup();
      const { onViewDetail } = renderWith();

      const row = screen.getByText("Sarah Johnson").closest("tr");
      expect(row).not.toBeNull();
      const viewBtn = within(row as HTMLElement).getByTitle("viewDetails");

      await user.click(viewBtn);
      expect(onViewDetail).toHaveBeenCalledTimes(1);
      expect(onViewDetail).toHaveBeenCalledWith(
        expect.objectContaining({ id: "mp-001", fullName: "Sarah Johnson" }),
      );
    });
  });
});
