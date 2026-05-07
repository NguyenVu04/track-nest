import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
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
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
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
    expect(screen.getByText("User Profile")).toBeInTheDocument();
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
    expect(screen.getByText("Update Profile")).toBeInTheDocument();
    expect(screen.getByText("Update Password")).toBeInTheDocument();
  });
});

describe("ProfilePage — update profile", () => {
  it("shows success message after submitting profile form", () => {
    render(<ProfilePage />);
    const form = screen.getByText("Update Profile").closest("form")!;
    fireEvent.submit(form);
    expect(
      screen.getByText("Profile updated successfully!"),
    ).toBeInTheDocument();
  });

  it("clears success message after 3 seconds", () => {
    render(<ProfilePage />);
    fireEvent.submit(screen.getByText("Update Profile").closest("form")!);
    expect(screen.getByText("Profile updated successfully!")).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(3000));
    expect(
      screen.queryByText("Profile updated successfully!"),
    ).not.toBeInTheDocument();
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
  it("shows success message when passwords match", () => {
    render(<ProfilePage />);
    fireEvent.change(screen.getByLabelText("Current Password"), {
      target: { value: "old123" },
    });
    fireEvent.change(screen.getByLabelText("New Password"), {
      target: { value: "new456" },
    });
    fireEvent.change(screen.getByLabelText("Confirm New Password"), {
      target: { value: "new456" },
    });
    fireEvent.submit(screen.getByText("Update Password").closest("form")!);
    expect(
      screen.getByText("Password updated successfully!"),
    ).toBeInTheDocument();
  });

  it("clears password fields after successful update", () => {
    render(<ProfilePage />);
    const currentPwInput = screen.getByLabelText("Current Password");
    const newPwInput = screen.getByLabelText("New Password");
    const confirmPwInput = screen.getByLabelText("Confirm New Password");
    fireEvent.change(currentPwInput, { target: { value: "old123" } });
    fireEvent.change(newPwInput, { target: { value: "new456" } });
    fireEvent.change(confirmPwInput, { target: { value: "new456" } });
    fireEvent.submit(screen.getByText("Update Password").closest("form")!);
    expect(currentPwInput).toHaveValue("");
    expect(newPwInput).toHaveValue("");
    expect(confirmPwInput).toHaveValue("");
  });

  it("calls alert when passwords do not match", () => {
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    render(<ProfilePage />);
    fireEvent.change(screen.getByLabelText("New Password"), {
      target: { value: "abc" },
    });
    fireEvent.change(screen.getByLabelText("Confirm New Password"), {
      target: { value: "xyz" },
    });
    fireEvent.submit(screen.getByText("Update Password").closest("form")!);
    expect(alertSpy).toHaveBeenCalledWith("Passwords do not match!");
    alertSpy.mockRestore();
  });
});
