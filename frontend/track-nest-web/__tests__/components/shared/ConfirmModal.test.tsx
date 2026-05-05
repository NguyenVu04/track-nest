import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

describe("ConfirmModal (foundational)", () => {
  it("renders the title, message, and confirm/cancel buttons", () => {
    render(
      <ConfirmModal
        title="Delete Report"
        message='"Sarah Johnson" will be permanently removed.'
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        confirmText="Delete"
        confirmStyle="danger"
      />,
    );

    expect(screen.getByText("Delete Report")).toBeInTheDocument();
    expect(
      screen.getByText('"Sarah Johnson" will be permanently removed.'),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("invokes onConfirm exactly once when the confirm button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <ConfirmModal
        title="Publish"
        message="Publish this report?"
        onConfirm={onConfirm}
        onCancel={onCancel}
        confirmText="Publish"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Publish" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("invokes onCancel when the Cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <ConfirmModal
        title="Delete"
        message="Sure?"
        onConfirm={onConfirm}
        onCancel={onCancel}
        confirmText="Delete"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
