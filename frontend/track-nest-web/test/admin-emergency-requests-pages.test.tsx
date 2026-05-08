import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { User } from "@/types";

// ── Navigation mock ──────────────────────────────────────────────────────────

const mockPush = jest.fn();
let mockParams: Record<string, string> = { id: "req-1" };

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  usePathname: () => "/dashboard/emergency-requests/admin",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => mockParams,
}));

// ── Context mocks ─────────────────────────────────────────────────────────────

let mockUser: User | null = null;

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// ── Service mock ─────────────────────────────────────────────────────────────

const mockGetAllEmergencyRequests = jest.fn();

jest.mock("@/services/emergencyOpsService", () => ({
  emergencyOpsService: {
    getAllEmergencyRequests: (...args: unknown[]) =>
      mockGetAllEmergencyRequests(...args),
  },
}));

// ── Component mocks ──────────────────────────────────────────────────────────

jest.mock("@/components/loading/Loading", () => ({
  Loading: ({ fullScreen }: { fullScreen?: boolean }) => (
    <div data-testid="loading" data-fullscreen={String(!!fullScreen)} />
  ),
}));

jest.mock("@/components/layout/Breadcrumbs", () => ({
  Breadcrumbs: () => <nav data-testid="breadcrumbs" />,
}));

// ── Test data ─────────────────────────────────────────────────────────────────

const adminUser: User = {
  id: "admin-1",
  username: "admin",
  email: "admin@test.com",
  fullName: "Admin User",
  role: ["Admin"],
};

const reporterUser: User = {
  id: "u2",
  username: "reporter",
  email: "reporter@test.com",
  fullName: "Reporter",
  role: ["Reporter"],
};

const mockAdminRequest = {
  id: "req-1",
  status: "PENDING" as const,
  openedAt: Date.now(),
  closedAt: undefined,
  senderId: "sender-1",
  senderFirstName: "Alice",
  senderLastName: "Smith",
  senderUsername: "alice",
  senderEmail: "alice@test.com",
  senderPhoneNumber: "0901234567",
  senderAvatarUrl: undefined,
  targetId: "target-1",
  targetFirstName: "Bob",
  targetLastName: "Jones",
  targetUsername: "bob",
  targetEmail: "bob@test.com",
  targetPhoneNumber: "0907654321",
  targetAvatarUrl: undefined,
  targetLastLatitude: 10.8231,
  targetLastLongitude: 106.6297,
  serviceId: "svc-1",
  serviceUsername: "service_unit_1",
  servicePhoneNumber: "+84900000001",
  serviceEmail: "svc1@example.com",
};

const mockPageResponse = {
  items: [mockAdminRequest],
  totalItems: 1,
  totalPages: 1,
  currentPage: 0,
  pageSize: 10,
};

// ── Page component ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const AdminEmergencyRequestsPage = (require("@/app/dashboard/emergency-requests/admin/page") as { default: React.ComponentType }).default;

beforeEach(() => {
  mockUser = { ...adminUser };
  mockParams = { id: "req-1" };
  jest.clearAllMocks();
  sessionStorage.clear();
  mockGetAllEmergencyRequests.mockResolvedValue(mockPageResponse);
});

// ═══════════════════════════════════════════════════════════════════════════
// null user
// ═══════════════════════════════════════════════════════════════════════════

describe("AdminEmergencyRequestsPage — null user", () => {
  it("returns null when user is null", () => {
    mockUser = null;
    const { container } = render(<AdminEmergencyRequestsPage />);
    expect(container.firstChild).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// loading state
// ═══════════════════════════════════════════════════════════════════════════

describe("AdminEmergencyRequestsPage — loading state", () => {
  it("shows loader while fetching", () => {
    mockGetAllEmergencyRequests.mockReturnValue(new Promise(() => {}));
    render(<AdminEmergencyRequestsPage />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// role guard
// ═══════════════════════════════════════════════════════════════════════════

describe("AdminEmergencyRequestsPage — role guard", () => {
  it("shows access denied for non-Admin user", async () => {
    mockUser = reporterUser;
    render(<AdminEmergencyRequestsPage />);
    await waitFor(() =>
      expect(screen.getByText("accessDenied")).toBeInTheDocument(),
    );
  });

  it("renders table for Admin user", async () => {
    render(<AdminEmergencyRequestsPage />);
    await waitFor(() =>
      expect(screen.getByText("Alice Smith")).toBeInTheDocument(),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// loaded state — data display
// ═══════════════════════════════════════════════════════════════════════════

describe("AdminEmergencyRequestsPage — loaded state", () => {
  it("renders sender name", async () => {
    render(<AdminEmergencyRequestsPage />);
    await waitFor(() => expect(screen.getByText("Alice Smith")).toBeInTheDocument());
  });

  it("renders sender username", async () => {
    render(<AdminEmergencyRequestsPage />);
    await waitFor(() => expect(screen.getByText("@alice")).toBeInTheDocument());
  });

  it("renders target name", async () => {
    render(<AdminEmergencyRequestsPage />);
    await waitFor(() => expect(screen.getByText("Bob Jones")).toBeInTheDocument());
  });

  it("renders assigned service username", async () => {
    render(<AdminEmergencyRequestsPage />);
    await waitFor(() => expect(screen.getByText("@service_unit_1")).toBeInTheDocument());
  });

  it("renders assigned service email", async () => {
    render(<AdminEmergencyRequestsPage />);
    await waitFor(() => expect(screen.getByText("svc1@example.com")).toBeInTheDocument());
  });

  it("renders breadcrumbs", async () => {
    render(<AdminEmergencyRequestsPage />);
    await waitFor(() => expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument());
  });

  it("does NOT render Accept or Reject buttons (admin view is read-only)", async () => {
    render(<AdminEmergencyRequestsPage />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(screen.queryByTitle("accept")).not.toBeInTheDocument();
    expect(screen.queryByTitle("reject")).not.toBeInTheDocument();
    expect(screen.queryByTitle("close")).not.toBeInTheDocument();
  });

  it("calls getAllEmergencyRequests on mount", async () => {
    render(<AdminEmergencyRequestsPage />);
    await waitFor(() =>
      expect(mockGetAllEmergencyRequests).toHaveBeenCalledTimes(1),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// search filter
// ═══════════════════════════════════════════════════════════════════════════

describe("AdminEmergencyRequestsPage — search filter", () => {
  it("renders search input", async () => {
    render(<AdminEmergencyRequestsPage />);
    await waitFor(() =>
      expect(screen.getByPlaceholderText("searchPlaceholder")).toBeInTheDocument(),
    );
  });

  it("filters rows client-side by request ID prefix", async () => {
    render(<AdminEmergencyRequestsPage />);
    await waitFor(() => screen.getByText("Alice Smith"));
    const searchInput = screen.getByPlaceholderText("searchPlaceholder");
    fireEvent.change(searchInput, { target: { value: "nonexistent-id" } });
    await waitFor(() =>
      expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument(),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// status filter
// ═══════════════════════════════════════════════════════════════════════════

describe("AdminEmergencyRequestsPage — status filter", () => {
  it("calls getAllEmergencyRequests with status when filter changes", async () => {
    render(<AdminEmergencyRequestsPage />);
    await waitFor(() => screen.getByText("Alice Smith"));
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "PENDING" } });
    await waitFor(() =>
      expect(mockGetAllEmergencyRequests).toHaveBeenCalledWith(
        "PENDING",
        0,
        50,
      ),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// navigation to detail
// ═══════════════════════════════════════════════════════════════════════════

describe("AdminEmergencyRequestsPage — navigation", () => {
  it("navigates to detail page with ?from=admin when ID clicked", async () => {
    render(<AdminEmergencyRequestsPage />);
    await waitFor(() => screen.getByText("Alice Smith"));
    const idBtn = screen.getByText("req-1...");
    fireEvent.click(idBtn);
    expect(mockPush).toHaveBeenCalledWith(
      "/dashboard/emergency-requests/req-1?from=admin",
    );
  });

  it("stores request data in sessionStorage when navigating to detail", async () => {
    render(<AdminEmergencyRequestsPage />);
    await waitFor(() => screen.getByText("Alice Smith"));
    fireEvent.click(screen.getByText("req-1..."));
    const stored = sessionStorage.getItem("emergency-request-detail:req-1");
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!).id).toBe("req-1");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// empty state
// ═══════════════════════════════════════════════════════════════════════════

describe("AdminEmergencyRequestsPage — empty state", () => {
  it("shows no results message when list is empty", async () => {
    mockGetAllEmergencyRequests.mockResolvedValue({
      items: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: 0,
      pageSize: 10,
    });
    render(<AdminEmergencyRequestsPage />);
    await waitFor(() =>
      expect(screen.getByText("noResults")).toBeInTheDocument(),
    );
  });
});
