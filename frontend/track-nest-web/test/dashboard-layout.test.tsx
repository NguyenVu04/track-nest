import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { User } from "@/types";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockPathname = "/dashboard";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}));

let mockAuthState: {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: jest.Mock;
};

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

jest.mock("@/components/loading/Loading", () => ({
  Loading: ({ fullScreen }: { fullScreen?: boolean }) => (
    <div data-testid="loading" data-fullscreen={fullScreen ? "true" : "false"} />
  ),
}));

jest.mock("@/components/layout/Header", () => ({
  Header: ({ user, onLogout }: { user: User; onLogout: () => void }) => (
    <header data-testid="header">
      <span>{user.fullName}</span>
      <button onClick={onLogout} data-testid="logout">Logout</button>
    </header>
  ),
}));

jest.mock("@/components/layout/Sidebar", () => ({
  AppSidebar: () => <nav data-testid="sidebar" />,
}));

jest.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-provider">{children}</div>
  ),
  SidebarInset: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-inset">{children}</div>
  ),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const reporterUser: User = {
  id: "u1",
  username: "janedoe",
  email: "jane@example.com",
  fullName: "Jane Doe",
  role: ["Reporter"],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPathname = "/dashboard";
  mockAuthState = {
    user: reporterUser,
    isAuthenticated: true,
    isLoading: false,
    logout: jest.fn(),
  };
});

// Dynamic import so mocks are applied before module evaluation
// eslint-disable-next-line @typescript-eslint/no-require-imports
const getDashboardLayout = () =>
  require("@/app/dashboard/layout").default as React.ComponentType<{
    children: React.ReactNode;
  }>;

describe("DashboardLayout — loading state", () => {
  it("renders fullscreen loader when isLoading is true", () => {
    mockAuthState = { ...mockAuthState, isLoading: true };
    const DashboardLayout = getDashboardLayout();
    render(<DashboardLayout><div>page</div></DashboardLayout>);
    expect(screen.getByTestId("loading")).toHaveAttribute("data-fullscreen", "true");
  });

  it("does not render children while loading", () => {
    mockAuthState = { ...mockAuthState, isLoading: true };
    const DashboardLayout = getDashboardLayout();
    render(<DashboardLayout><div data-testid="page">page</div></DashboardLayout>);
    expect(screen.queryByTestId("page")).not.toBeInTheDocument();
  });
});

describe("DashboardLayout — unauthenticated", () => {
  it("returns null (nothing rendered) when not authenticated", () => {
    mockAuthState = { user: null, isAuthenticated: false, isLoading: false, logout: jest.fn() };
    const DashboardLayout = getDashboardLayout();
    const { container } = render(<DashboardLayout><div>page</div></DashboardLayout>);
    expect(container.firstChild).toBeNull();
  });

  it("redirects to /login when not authenticated", () => {
    mockAuthState = { user: null, isAuthenticated: false, isLoading: false, logout: jest.fn() };
    const DashboardLayout = getDashboardLayout();
    render(<DashboardLayout><div>page</div></DashboardLayout>);
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});

describe("DashboardLayout — authenticated", () => {
  it("renders sidebar", () => {
    const DashboardLayout = getDashboardLayout();
    render(<DashboardLayout><div>page</div></DashboardLayout>);
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("renders header with user name", () => {
    const DashboardLayout = getDashboardLayout();
    render(<DashboardLayout><div>page</div></DashboardLayout>);
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("renders children", () => {
    const DashboardLayout = getDashboardLayout();
    render(
      <DashboardLayout><div data-testid="child-content">page content</div></DashboardLayout>,
    );
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("renders SidebarProvider", () => {
    const DashboardLayout = getDashboardLayout();
    render(<DashboardLayout><div>page</div></DashboardLayout>);
    expect(screen.getByTestId("sidebar-provider")).toBeInTheDocument();
  });
});

describe("DashboardLayout — role-based routing", () => {
  it("replaces route when Reporter accesses an admin-only page", () => {
    mockPathname = "/dashboard/accounts";
    const DashboardLayout = getDashboardLayout();
    render(<DashboardLayout><div>page</div></DashboardLayout>);
    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });

  it("does not replace route when Reporter accesses allowed page", () => {
    mockPathname = "/dashboard/missing-persons";
    const DashboardLayout = getDashboardLayout();
    render(<DashboardLayout><div>page</div></DashboardLayout>);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("does not replace route for base /dashboard path", () => {
    mockPathname = "/dashboard";
    const DashboardLayout = getDashboardLayout();
    render(<DashboardLayout><div>page</div></DashboardLayout>);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("Emergency Service can access emergency-requests", () => {
    mockAuthState = {
      ...mockAuthState,
      user: { ...reporterUser, role: ["Emergency Service"] },
    };
    mockPathname = "/dashboard/emergency-requests";
    const DashboardLayout = getDashboardLayout();
    render(<DashboardLayout><div>page</div></DashboardLayout>);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("Reporter cannot access emergency-requests", () => {
    mockPathname = "/dashboard/emergency-requests";
    const DashboardLayout = getDashboardLayout();
    render(<DashboardLayout><div>page</div></DashboardLayout>);
    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });
});

describe("DashboardLayout — logout", () => {
  it("calls logout and redirects to /login on logout click", () => {
    const DashboardLayout = getDashboardLayout();
    render(<DashboardLayout><div>page</div></DashboardLayout>);
    const logoutBtn = screen.getByTestId("logout");
    logoutBtn.click();
    expect(mockAuthState.logout).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});
