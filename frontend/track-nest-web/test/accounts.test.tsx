import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { User } from "@/types";

// ── Navigation mock (includes useParams) ─────────────────────────────────────

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = { id: "user-2" };

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  usePathname: () => "/dashboard/accounts",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => mockParams,
}));

// ── Context mocks ─────────────────────────────────────────────────────────────

let mockUser: User | null = null;

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// ── Component mocks ──────────────────────────────────────────────────────────

jest.mock("@/components/shared/ConfirmModal", () => ({
  ConfirmModal: ({
    title,
    onConfirm,
    onCancel,
  }: {
    title: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) => (
    <div data-testid="confirm-modal">
      <span>{title}</span>
      <button onClick={onConfirm} data-testid="confirm-btn">Confirm</button>
      <button onClick={onCancel} data-testid="cancel-btn">Cancel</button>
    </div>
  ),
}));

jest.mock("@/components/loading/Loading", () => ({
  Loading: () => <div data-testid="loading" />,
}));

// ── Test data ─────────────────────────────────────────────────────────────────

const adminUser: User = {
  id: "admin-1",
  username: "admin",
  email: "admin@example.com",
  fullName: "Admin User",
  role: ["Admin"],
};

const otherUser: User = {
  id: "user-2",
  username: "other",
  email: "other@example.com",
  fullName: "Other User",
  role: ["Reporter"],
  status: "Active",
};

// ── Page components ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const AccountsPage = (require("@/app/dashboard/accounts/page") as { default: React.ComponentType }).default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AccountDetailPage = (require("@/app/dashboard/accounts/[id]/page") as { default: React.ComponentType }).default;

beforeEach(() => {
  mockUser = { ...adminUser };
  mockParams = { id: "user-2" };
  jest.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════
// AccountsPage
// ═══════════════════════════════════════════════════════════════════════════

describe("AccountsPage — null user", () => {
  it("shows Access Denied when user is null", () => {
    mockUser = null;
    const Page = AccountsPage;
    render(<Page />);
    expect(screen.getByText("Access Denied")).toBeInTheDocument();
  });

  it("shows go-to-dashboard button on access denied", () => {
    mockUser = null;
    const Page = AccountsPage;
    render(<Page />);
    expect(screen.getByText("← Go to Dashboard")).toBeInTheDocument();
  });

  it("navigates to dashboard when denied button clicked", () => {
    mockUser = null;
    const Page = AccountsPage;
    render(<Page />);
    fireEvent.click(screen.getByText("← Go to Dashboard"));
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });
});

describe("AccountsPage — authenticated", () => {
  it("renders Account Management heading", () => {
    const Page = AccountsPage;
    render(<Page />);
    expect(screen.getByText("Account Management")).toBeInTheDocument();
  });

  it("renders 0 total accounts initially", () => {
    const Page = AccountsPage;
    render(<Page />);
    expect(screen.getByText("0 total accounts")).toBeInTheDocument();
  });

  it("renders search input", () => {
    const Page = AccountsPage;
    render(<Page />);
    expect(
      screen.getByPlaceholderText("Search by name, username, or email..."),
    ).toBeInTheDocument();
  });

  it("renders role filter select", () => {
    const Page = AccountsPage;
    render(<Page />);
    expect(screen.getByDisplayValue("All Roles")).toBeInTheDocument();
  });

  it("renders status filter select", () => {
    const Page = AccountsPage;
    render(<Page />);
    expect(screen.getByDisplayValue("All Statuses")).toBeInTheDocument();
  });

  it("shows No accounts found when list is empty", () => {
    const Page = AccountsPage;
    render(<Page />);
    expect(screen.getByText("No accounts found.")).toBeInTheDocument();
  });

  it("updates search query on input change", () => {
    const Page = AccountsPage;
    render(<Page />);
    const input = screen.getByPlaceholderText(
      "Search by name, username, or email...",
    );
    fireEvent.change(input, { target: { value: "john" } });
    expect(input).toHaveValue("john");
  });

  it("updates role filter on select change", () => {
    const Page = AccountsPage;
    render(<Page />);
    const select = screen.getByDisplayValue("All Roles");
    fireEvent.change(select, { target: { value: "Reporter" } });
    expect(select).toHaveValue("Reporter");
  });

  it("updates status filter on select change", () => {
    const Page = AccountsPage;
    render(<Page />);
    const select = screen.getByDisplayValue("All Statuses");
    fireEvent.change(select, { target: { value: "Active" } });
    expect(select).toHaveValue("Active");
  });

  it("renders table headers", () => {
    const Page = AccountsPage;
    render(<Page />);
    expect(screen.getByText("User")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// AccountDetailPage
// ═══════════════════════════════════════════════════════════════════════════

describe("AccountDetailPage — null user", () => {
  it("shows Access Denied when user is null", () => {
    mockUser = null;
    const Page = AccountDetailPage;
    render(<Page />);
    expect(screen.getByText("Access Denied")).toBeInTheDocument();
  });

  it("shows go-to-dashboard button on denied", () => {
    mockUser = null;
    const Page = AccountDetailPage;
    render(<Page />);
    expect(screen.getByText("← Go to Dashboard")).toBeInTheDocument();
  });

  it("navigates to dashboard when button clicked", () => {
    mockUser = null;
    const Page = AccountDetailPage;
    render(<Page />);
    fireEvent.click(screen.getByText("← Go to Dashboard"));
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });
});

describe("AccountDetailPage — account not found", () => {
  it("shows Account Not Found when users state is empty", () => {
    const Page = AccountDetailPage;
    render(<Page />);
    expect(screen.getByText("Account Not Found")).toBeInTheDocument();
  });

  it("renders go back button", () => {
    const Page = AccountDetailPage;
    render(<Page />);
    expect(screen.getByText("← Go Back")).toBeInTheDocument();
  });

  it("calls router.back when go back button clicked", () => {
    const Page = AccountDetailPage;
    render(<Page />);
    fireEvent.click(screen.getByText("← Go Back"));
    expect(mockBack).toHaveBeenCalled();
  });
});

describe("AccountDetailPage — renders detail with pre-populated account", () => {
  it("shows Account Not Found state (stub implementation)", () => {
    // The page initializes users as [] and has no API fetch.
    // selectedAccount is always undefined → shows not-found state.
    const Page = AccountDetailPage;
    render(<Page />);
    expect(screen.getByText("Account Not Found")).toBeInTheDocument();
  });
});

void otherUser; // used for type checks above
