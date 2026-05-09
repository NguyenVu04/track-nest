/**
 * Use cases under test:
 *  - EMERGENCY-UC-02: Reject an emergency request.
 *  - EMERGENCY-UC-03: Accept an emergency request.
 *  - EMERGENCY-UC-04: Close (complete) an accepted emergency request.
 *
 * Note: jest.mock factories cannot reference out-of-scope vars unless prefixed
 *       `mock*`, so we mock with bare jest.fn() and grab handles via imports.
 */

jest.mock("@/services/emergencyOpsService", () => ({
  __esModule: true,
  emergencyOpsService: {
    getEmergencyRequests: jest.fn(),
    acceptEmergencyRequest: jest.fn(),
    rejectEmergencyRequest: jest.fn(),
    closeEmergencyRequest: jest.fn(),
  },
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/contexts/NotificationContext", () => ({
  useNotification: jest.fn(),
}));

jest.mock("@/contexts/EmergencyRequestRealtimeContext", () => ({
  useEmergencyRequestRealtime: () => ({ refresh: 0 }),
}));

jest.mock("@/components/shared/MapView", () => ({
  __esModule: true,
  MapView: () => <div data-testid="map" />,
}));

jest.mock("@/components/loading/Loading", () => ({
  __esModule: true,
  Loading: () => <div data-testid="loading" />,
}));

jest.mock("@/components/layout/Breadcrumbs", () => ({
  __esModule: true,
  Breadcrumbs: () => <div />,
}));

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmergencyRequestsPage from "@/app/dashboard/emergency-requests/page";
import { emergencyOpsService } from "@/services/emergencyOpsService";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";

// Typed handles to the mocks.
const svc = emergencyOpsService as jest.Mocked<typeof emergencyOpsService>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;

// Stable jest.fn for addNotification so tests can assert.
const addNotification = jest.fn();

// ── Fixtures ─────────────────────────────────────────────────────────────
const pendingRequest = {
  id: "11111111-aaaa-bbbb-cccc-000000000001",
  senderId: "u-1",
  senderUsername: "alice",
  senderFirstName: "Alice",
  senderLastName: "Smith",
  senderPhoneNumber: "+1",
  senderEmail: "a@example.com",
  targetId: "u-2",
  targetUsername: "bob",
  targetFirstName: "Bob",
  targetLastName: "Jones",
  targetPhoneNumber: "+1",
  targetEmail: "b@example.com",
  openedAt: 1_700_000_000_000,
  status: "PENDING" as const,
  targetLastLatitude: 10.78,
  targetLastLongitude: 106.69,
  serviceId: "svc-1",
  serviceUsername: "service_unit_1",
  servicePhoneNumber: "+84900000001",
  serviceEmail: "svc1@example.com",
};

const acceptedRequest = {
  ...pendingRequest,
  id: "22222222-aaaa-bbbb-cccc-000000000002",
  status: "ACCEPTED" as const,
};

const emergencyUser = {
  id: "es-1",
  username: "es",
  email: "es@example.com",
  fullName: "Emergency One",
  role: ["Emergency Service"] as const,
};

beforeEach(() => {
  jest.clearAllMocks();

  mockUseAuth.mockReturnValue({
    user: emergencyUser as unknown as ReturnType<typeof useAuth>["user"],
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
  });

  mockUseNotification.mockReturnValue({
    addNotification,
    notifications: [],
    markAsRead: jest.fn(),
    removeNotification: jest.fn(),
    clearAll: jest.fn(),
    unreadCount: 0,
  });

  svc.getEmergencyRequests.mockResolvedValue({
    items: [pendingRequest, acceptedRequest],
    totalItems: 2,
    totalPages: 1,
    currentPage: 0,
    pageSize: 50,
  });
});

const findRow = (id: string) =>
  screen.getByText(id.substring(0, 8) + "...").closest("tr") as HTMLElement;

describe("EmergencyRequestsPage", () => {
  describe("EMERGENCY-UC-03 — Accept Emergency Request", () => {
    it("calls acceptEmergencyRequest and updates the row to ACCEPTED", async () => {
      const user = userEvent.setup();
      svc.acceptEmergencyRequest.mockResolvedValue({
        id: pendingRequest.id,
        acceptedAtMs: Date.now(),
      });

      render(<EmergencyRequestsPage />);

      const pendingRow = await waitFor(() => findRow(pendingRequest.id));
      await user.click(within(pendingRow).getByTitle("accept"));

      await waitFor(() =>
        expect(svc.acceptEmergencyRequest).toHaveBeenCalledWith(
          pendingRequest.id,
        ),
      );
      expect(addNotification).toHaveBeenCalledTimes(1);

      const row = findRow(pendingRequest.id);
      expect(within(row).queryByTitle("accept")).not.toBeInTheDocument();
      expect(within(row).queryByTitle("reject")).not.toBeInTheDocument();
      expect(within(row).getByTitle("close")).toBeInTheDocument();
    });
  });

  describe("EMERGENCY-UC-02 — Reject Emergency Request", () => {
    it("requires a non-empty reason before submit", async () => {
      const user = userEvent.setup();
      render(<EmergencyRequestsPage />);
      const row = await waitFor(() => findRow(pendingRequest.id));

      await user.click(within(row).getByTitle("reject"));

      const confirmBtn = screen.getByRole("button", { name: "confirmReject" });
      expect(confirmBtn).toBeDisabled();
      expect(svc.rejectEmergencyRequest).not.toHaveBeenCalled();
    });

    it("submits the rejection and updates the row to REJECTED when a reason is provided", async () => {
      const user = userEvent.setup();
      svc.rejectEmergencyRequest.mockResolvedValue({
        id: pendingRequest.id,
        rejectedAtMs: Date.now(),
      });

      render(<EmergencyRequestsPage />);
      const row = await waitFor(() => findRow(pendingRequest.id));
      await user.click(within(row).getByTitle("reject"));

      await user.type(
        screen.getByPlaceholderText("rejectReasonPlaceholder"),
        "Out of coverage area.",
      );
      await user.click(screen.getByRole("button", { name: "confirmReject" }));

      await waitFor(() =>
        expect(svc.rejectEmergencyRequest).toHaveBeenCalledWith(
          pendingRequest.id,
        ),
      );

      const updated = findRow(pendingRequest.id);
      expect(within(updated).queryByTitle("accept")).not.toBeInTheDocument();
      expect(within(updated).queryByTitle("reject")).not.toBeInTheDocument();
    });
  });

  describe("EMERGENCY-UC-04 — Complete (Close) Emergency Request", () => {
    it("requires a completion note before allowing close", async () => {
      const user = userEvent.setup();
      render(<EmergencyRequestsPage />);
      const row = await waitFor(() => findRow(acceptedRequest.id));

      await user.click(within(row).getByTitle("close"));

      const confirm = screen.getByRole("button", { name: "confirmClose" });
      expect(confirm).toBeDisabled();
      expect(svc.closeEmergencyRequest).not.toHaveBeenCalled();
    });

    it("calls closeEmergencyRequest and marks the row CLOSED on submit", async () => {
      const user = userEvent.setup();
      svc.closeEmergencyRequest.mockResolvedValue({
        id: acceptedRequest.id,
        closedAtMs: Date.now(),
      });

      render(<EmergencyRequestsPage />);
      const row = await waitFor(() => findRow(acceptedRequest.id));
      await user.click(within(row).getByTitle("close"));

      await user.type(
        screen.getByPlaceholderText("closeNotePlaceholder"),
        "Resolved on site.",
      );
      await user.click(screen.getByRole("button", { name: "confirmClose" }));

      await waitFor(() =>
        expect(svc.closeEmergencyRequest).toHaveBeenCalledWith(
          acceptedRequest.id,
        ),
      );
      const updated = findRow(acceptedRequest.id);
      expect(within(updated).queryByTitle("close")).not.toBeInTheDocument();
    });
  });
});
