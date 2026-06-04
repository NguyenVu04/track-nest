import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { User } from "@/types";

// ── Navigation mock ──────────────────────────────────────────────────────────

const mockPush = jest.fn();
let mockParams: Record<string, string> = { id: "req-1" };

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  usePathname: () => "/dashboard/emergency-requests",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => mockParams,
}));

// ── Context mocks ─────────────────────────────────────────────────────────────

let mockUser: User | null = null;

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

jest.mock("@/contexts/NotificationContext", () => ({
  useNotification: () => ({ addNotification: jest.fn() }),
}));

jest.mock("@/contexts/EmergencyRequestRealtimeContext", () => ({
  useEmergencyRequestRealtime: () => ({ refresh: 0 }),
}));

// ── Service mock ─────────────────────────────────────────────────────────────

const mockGetEmergencyRequests = jest.fn();
const mockAcceptEmergencyRequest = jest.fn();
const mockRejectEmergencyRequest = jest.fn();
const mockCloseEmergencyRequest = jest.fn();

jest.mock("@/services/emergencyOpsService", () => ({
  emergencyOpsService: {
    getEmergencyRequests: (...args: unknown[]) =>
      mockGetEmergencyRequests(...args),
    acceptEmergencyRequest: (...args: unknown[]) =>
      mockAcceptEmergencyRequest(...args),
    rejectEmergencyRequest: (...args: unknown[]) =>
      mockRejectEmergencyRequest(...args),
    closeEmergencyRequest: (...args: unknown[]) =>
      mockCloseEmergencyRequest(...args),
  },
}));

// ── Component mocks ──────────────────────────────────────────────────────────

jest.mock("@/components/shared/MapView", () => ({
  MapView: () => <div data-testid="map-view" />,
}));

jest.mock("@/components/loading/Loading", () => ({
  Loading: ({ fullScreen }: { fullScreen?: boolean }) => (
    <div data-testid="loading" data-fullscreen={String(!!fullScreen)} />
  ),
}));

jest.mock("@/components/layout/Breadcrumbs", () => ({
  Breadcrumbs: () => <nav data-testid="breadcrumbs" />,
}));

// Render DropdownMenu children flat so action items are always queryable
// without simulating the Radix portal open/close gesture.
jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick, title, ...rest }: React.ComponentProps<"button">) => (
    <button onClick={onClick} title={title} {...rest}>{children}</button>
  ),
}));

// ── Test data ─────────────────────────────────────────────────────────────────

const emergencyUser: User = {
  id: "u1",
  username: "emergency",
  email: "emergency@test.com",
  fullName: "Emergency User",
  role: ["Emergency Service"],
};

const mockRequest = {
  id: "req-1",
  status: "PENDING",
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
};

const mockResponse = { items: [mockRequest] };

// ── Page components ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const EmergencyRequestsListPage = (require("@/app/dashboard/emergency-requests/page") as { default: React.ComponentType }).default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EmergencyRequestDetailPage = (require("@/app/dashboard/emergency-requests/[id]/page") as { default: React.ComponentType }).default;

beforeEach(() => {
  mockUser = { ...emergencyUser };
  mockParams = { id: "req-1" };
  jest.clearAllMocks();
  mockGetEmergencyRequests.mockResolvedValue(mockResponse);
  mockAcceptEmergencyRequest.mockResolvedValue(undefined);
  mockRejectEmergencyRequest.mockResolvedValue(undefined);
  mockCloseEmergencyRequest.mockResolvedValue({ closedAtMs: Date.now() });
  // Reset sessionStorage
  sessionStorage.clear();
});

// ═══════════════════════════════════════════════════════════════════════════
// EmergencyRequestsPage (list)
// ═══════════════════════════════════════════════════════════════════════════

describe("EmergencyRequestsPage — null user", () => {
  it("returns null when user is not set", () => {
    mockUser = null;
const { container } = render(<EmergencyRequestsListPage />);
    expect(container.firstChild).toBeNull();
  });
});

describe("EmergencyRequestsPage — loading state", () => {
  it("shows loader while fetching", () => {
    mockGetEmergencyRequests.mockReturnValue(new Promise(() => {}));
render(<EmergencyRequestsListPage />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });
});

describe("EmergencyRequestsPage — loaded state", () => {
  it("renders the table with request row", async () => {
render(<EmergencyRequestsListPage />);
    await waitFor(() => expect(screen.getByText("Alice Smith")).toBeInTheDocument());
  });

  it("renders sender full name", async () => {
render(<EmergencyRequestsListPage />);
    await waitFor(() => expect(screen.getByText("Alice Smith")).toBeInTheDocument());
  });

  it("renders breadcrumbs", async () => {
render(<EmergencyRequestsListPage />);
    await waitFor(() =>
      expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument(),
    );
  });

  it("renders search input", async () => {
render(<EmergencyRequestsListPage />);
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText("Search alerts..."),
      ).toBeInTheDocument(),
    );
  });

  it("renders status filter combobox", async () => {
render(<EmergencyRequestsListPage />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("shows accept and reject buttons for PENDING requests (Emergency Service role)", async () => {
render(<EmergencyRequestsListPage />);
    await waitFor(() => screen.getByText("Alice Smith"));
    // Accept and Reject items use title attrs for testability
    const acceptBtns = document.querySelectorAll('[title="accept"]');
    expect(acceptBtns.length).toBeGreaterThan(0);
  });

  it("calls acceptEmergencyRequest when accept button clicked", async () => {
render(<EmergencyRequestsListPage />);
    await waitFor(() => screen.getByText("Alice Smith"));
    const acceptBtn = document.querySelector(
      '[title="accept"]',
    ) as HTMLButtonElement;
    fireEvent.click(acceptBtn);
    await waitFor(() =>
      expect(mockAcceptEmergencyRequest).toHaveBeenCalledWith("req-1"),
    );
  });

  it("opens reject modal when reject button clicked", async () => {
render(<EmergencyRequestsListPage />);
    await waitFor(() => screen.getByText("Alice Smith"));
    const rejectBtn = document.querySelector(
      '[title="reject"]',
    ) as HTMLButtonElement;
    fireEvent.click(rejectBtn);
    await waitFor(() =>
      expect(
        screen.getByText("rejectModalTitle"),
      ).toBeInTheDocument(),
    );
  });

  it("navigates to detail page when row is clicked", async () => {
render(<EmergencyRequestsListPage />);
    await waitFor(() => screen.getByText("Alice Smith"));
    // The whole <tr> is clickable — find it via data-request-id
    const row = document.querySelector('[data-request-id="req-1"]') as HTMLElement;
    fireEvent.click(row);
    expect(mockPush).toHaveBeenCalledWith("/dashboard/emergency-requests/req-1");
  });

  it("shows toast error when fetch fails", async () => {
    mockGetEmergencyRequests.mockRejectedValue(new Error("Network error"));
    const { toast } = require("sonner");
render(<EmergencyRequestsListPage />);
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});

describe("EmergencyRequestsPage — role guard", () => {
  it("shows access denied for non-Emergency-Service user", async () => {
    mockUser = {
      id: "u2",
      username: "reporter",
      email: "r@test.com",
      fullName: "Reporter",
      role: ["Reporter"],
    };
    render(<EmergencyRequestsListPage />);
    await waitFor(() =>
      expect(screen.getByText("accessDenied")).toBeInTheDocument(),
    );
  });
});

describe("EmergencyRequestsPage — reject flow", () => {
  it("cancels reject modal when cancel clicked", async () => {
render(<EmergencyRequestsListPage />);
    await waitFor(() => screen.getByText("Alice Smith"));
    const rejectBtn = document.querySelector(
      '[title="reject"]',
    ) as HTMLButtonElement;
    fireEvent.click(rejectBtn);
    await waitFor(() =>
      screen.getByText("rejectModalTitle"),
    );
    fireEvent.click(screen.getByText("cancel"));
    await waitFor(() =>
      expect(
        screen.queryByText("rejectModalTitle"),
      ).not.toBeInTheDocument(),
    );
  });

  it("calls rejectEmergencyRequest when reason is provided and confirmed", async () => {
render(<EmergencyRequestsListPage />);
    await waitFor(() => screen.getByText("Alice Smith"));
    const rejectBtn = document.querySelector(
      '[title="reject"]',
    ) as HTMLButtonElement;
    fireEvent.click(rejectBtn);
    await waitFor(() =>
      screen.getByText("rejectModalTitle"),
    );
    fireEvent.change(screen.getByPlaceholderText("rejectReasonPlaceholder"), {
      target: { value: "Unsafe situation" },
    });
    fireEvent.click(screen.getByText("confirmReject"));
    await waitFor(() =>
      expect(mockRejectEmergencyRequest).toHaveBeenCalledWith("req-1"),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// EmergencyRequestDetailPage
// ═══════════════════════════════════════════════════════════════════════════

describe("EmergencyRequestDetailPage — null user", () => {
  it("returns null when user is not set", () => {
    mockUser = null;
    const { container } = render(<EmergencyRequestDetailPage />);
    expect(container.firstChild).toBeNull();
  });
});

describe("EmergencyRequestDetailPage — no sessionStorage data", () => {
  it("shows Request not found when no sessionStorage data", async () => {
    render(<EmergencyRequestDetailPage />);
    await waitFor(() =>
      expect(screen.getByText("Request not found.")).toBeInTheDocument(),
    );
  });

  it("renders back-to-list button when not found", async () => {
    render(<EmergencyRequestDetailPage />);
    await waitFor(() => screen.getByText("Back to list"));
    fireEvent.click(screen.getByText("Back to list"));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/emergency-requests");
  });
});

describe("EmergencyRequestDetailPage — with sessionStorage data", () => {
  beforeEach(() => {
    sessionStorage.setItem(
      "emergency-request-detail:req-1",
      JSON.stringify(mockRequest),
    );
  });

  it("renders the request detail", async () => {
    render(<EmergencyRequestDetailPage />);
    await waitFor(() =>
      expect(
        screen.getByText(/Emergency Request: REQ-1/i),
      ).toBeInTheDocument(),
    );
  });

  it("renders sender and target profile cards", async () => {
    render(<EmergencyRequestDetailPage />);
    await waitFor(() => screen.getByText(/Emergency Request: REQ-1/i));
    expect(screen.getByText("SENDER")).toBeInTheDocument();
    expect(screen.getByText("TARGET")).toBeInTheDocument();
  });

  it("renders map view for location", async () => {
    render(<EmergencyRequestDetailPage />);
    await waitFor(() => screen.getByText(/Emergency Request: REQ-1/i));
    expect(screen.getByTestId("map-view")).toBeInTheDocument();
  });

  it("navigates back to list when Back button clicked", async () => {
    render(<EmergencyRequestDetailPage />);
    await waitFor(() => screen.getByText(/Emergency Request: REQ-1/i));
    fireEvent.click(screen.getByText("Emergency Hub"));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/emergency-requests");
  });
});
