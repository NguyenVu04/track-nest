import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { User } from "@/types";

// ── Mocks ────────────────────────────────────────────────────────────────────

let mockUser: User | null = null;

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// ── Test data ─────────────────────────────────────────────────────────────────

const baseUser: User = {
  id: "u1",
  username: "janedoe",
  email: "jane@example.com",
  fullName: "Jane Doe",
  role: ["Reporter"],
};

// ── Import after mocks ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ProfilePage = require("@/app/dashboard/profile/page").default as React.ComponentType;

beforeEach(() => {
  mockUser = { ...baseUser };
});

describe("ProfilePage — null user", () => {
  it("returns null when user is not set", () => {
    mockUser = null;
    const { container } = render(<ProfilePage />);
    expect(container.firstChild).toBeNull();
  });
});

describe("ProfilePage — rendering", () => {
  it("renders the User Profile heading", () => {
    render(<ProfilePage />);
    // useTranslations mock returns the key: t("pageTitle") → "pageTitle"
    expect(screen.getByRole("heading", { name: "pageTitle" })).toBeInTheDocument();
  });

  it("renders the username input as disabled", () => {
    render(<ProfilePage />);
    const usernameInput = screen.getByDisplayValue("janedoe");
    expect(usernameInput).toBeDisabled();
  });

  it("renders the fullName input with user value", () => {
    render(<ProfilePage />);
    expect(screen.getByDisplayValue("Jane Doe")).toBeInTheDocument();
  });

  it("renders the email input with user value", () => {
    render(<ProfilePage />);
    expect(screen.getByDisplayValue("jane@example.com")).toBeInTheDocument();
  });

  it("renders the role input as disabled", () => {
    render(<ProfilePage />);
    const roleInput = screen.getByDisplayValue("Reporter");
    expect(roleInput).toBeDisabled();
  });

  it("renders Update Profile and Update Password buttons", () => {
    render(<ProfilePage />);
    // t("updateProfile") → "updateProfile", t("updatePassword") → "updatePassword"
    expect(screen.getByText("updateProfile")).toBeInTheDocument();
    expect(screen.getByText("updatePassword")).toBeInTheDocument();
  });
});

describe("ProfilePage — update profile", () => {
  it("calls toast.success after submitting profile form", async () => {
    const { toast } = require("sonner");
    render(<ProfilePage />);
    const form = screen.getByText("updateProfile").closest("form")!;
    fireEvent.submit(form);
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("toastProfileUpdated"),
    );
  });

  it("preserves form field values after profile update", async () => {
    const { toast } = require("sonner");
    render(<ProfilePage />);
    fireEvent.submit(screen.getByText("updateProfile").closest("form")!);
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(screen.getByDisplayValue("Jane Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("jane@example.com")).toBeInTheDocument();
  });

  it("allows editing fullName", () => {
    render(<ProfilePage />);
    const input = screen.getByDisplayValue("Jane Doe");
    fireEvent.change(input, { target: { value: "Jane Smith" } });
    expect(input).toHaveValue("Jane Smith");
  });

  it("allows editing email", () => {
    render(<ProfilePage />);
    const input = screen.getByDisplayValue("jane@example.com");
    fireEvent.change(input, { target: { value: "jane@new.com" } });
    expect(input).toHaveValue("jane@new.com");
  });
});

describe("ProfilePage — update password", () => {
  it("calls toast.success when passwords match", async () => {
    const { toast } = require("sonner");
    render(<ProfilePage />);
    // Labels use t("labelXxx") → key string e.g. "labelCurrentPassword"
    fireEvent.change(screen.getByLabelText("labelCurrentPassword"), {
      target: { value: "oldpass123" },
    });
    fireEvent.change(screen.getByLabelText("labelNewPassword"), {
      target: { value: "newpass123" },
    });
    fireEvent.change(screen.getByLabelText("labelConfirmPassword"), {
      target: { value: "newpass123" },
    });
    fireEvent.submit(screen.getByText("updatePassword").closest("form")!);
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("toastPasswordUpdated"),
    );
  });

  it("clears password fields after successful update", async () => {
    render(<ProfilePage />);
    const currentPwInput = screen.getByLabelText("labelCurrentPassword");
    const newPwInput = screen.getByLabelText("labelNewPassword");
    const confirmPwInput = screen.getByLabelText("labelConfirmPassword");
    fireEvent.change(currentPwInput, { target: { value: "oldpass123" } });
    fireEvent.change(newPwInput, { target: { value: "newpass123" } });
    fireEvent.change(confirmPwInput, { target: { value: "newpass123" } });
    fireEvent.submit(screen.getByText("updatePassword").closest("form")!);
    await waitFor(() => {
      expect(currentPwInput).toHaveValue("");
      expect(newPwInput).toHaveValue("");
      expect(confirmPwInput).toHaveValue("");
    });
  });

  it("shows validation error when passwords do not match", async () => {
    render(<ProfilePage />);
    fireEvent.change(screen.getByLabelText("labelCurrentPassword"), {
      target: { value: "oldpass123" },
    });
    fireEvent.change(screen.getByLabelText("labelNewPassword"), {
      target: { value: "newpass123" },
    });
    fireEvent.change(screen.getByLabelText("labelConfirmPassword"), {
      target: { value: "different1" },
    });
    fireEvent.submit(screen.getByText("updatePassword").closest("form")!);
    await waitFor(() =>
      expect(
        screen.getByText("validation.confirmPasswordMatch"),
      ).toBeInTheDocument(),
    );
  });
});
