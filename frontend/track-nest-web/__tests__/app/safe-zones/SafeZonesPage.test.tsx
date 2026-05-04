/**
 * Use cases under test:
 *  - EMERGENCY-UC-05: Emergency Service removes a safe zone.
 *  - EMERGENCY-UC-06: Emergency Service adds a new safe zone.
 *
 * Note: jest.mock factories cannot reference out-of-scope vars unless prefixed
 *       `mock*`, so we keep factories pure and grab handles via imports.
 */

jest.mock("@/services/emergencyOpsService", () => ({
  __esModule: true,
  emergencyOpsService: {
    getSafeZones: jest.fn(),
    createSafeZone: jest.fn(),
    deleteSafeZone: jest.fn(),
  },
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// MapView stub: exposes the most recent onMapClick via a button so tests can
// drive coordinate selection without Leaflet.
jest.mock("@/components/shared/MapView", () => ({
  __esModule: true,
  MapView: ({
    onMapClick,
  }: {
    onMapClick?: (pos: [number, number]) => void;
  }) => (
    <div data-testid="map">
      {onMapClick && (
        <button
          type="button"
          data-testid="map-click"
          onClick={() => onMapClick([10.776, 106.7])}
        >
          stub map click
        </button>
      )}
    </div>
  ),
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
import SafeZonesPage from "@/app/dashboard/safe-zones/page";
import { emergencyOpsService } from "@/services/emergencyOpsService";
import { useAuth } from "@/contexts/AuthContext";

const svc = emergencyOpsService as jest.Mocked<typeof emergencyOpsService>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const fixtureZone = {
  id: "sz-001",
  name: "Central Police Station",
  latitude: 10.78,
  longitude: 106.69,
  radius: 500,
  createdAt: "2026-04-01T00:00:00Z",
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

  svc.getSafeZones.mockResolvedValue({
    items: [fixtureZone],
    totalItems: 1,
    totalPages: 1,
    currentPage: 0,
    pageSize: 50,
  });
});

describe("SafeZonesPage", () => {
  describe("EMERGENCY-UC-05 — Remove Safe Zone", () => {
    it("calls deleteSafeZone with the row id when the user confirms", async () => {
      const user = userEvent.setup();
      svc.deleteSafeZone.mockResolvedValue({ id: "sz-001", deleted: true });

      render(<SafeZonesPage />);
      await waitFor(() =>
        expect(screen.getByText("Central Police Station")).toBeInTheDocument(),
      );

      // Trash icon on the row.
      await user.click(screen.getByTitle("delete"));

      // ConfirmModal renders with the t("deleteTitle") key.
      expect(screen.getByText("deleteTitle")).toBeInTheDocument();
      // Disambiguate from the row's icon button (title="delete") by text.
      await user.click(screen.getByText("delete", { selector: "button" }));

      await waitFor(() =>
        expect(svc.deleteSafeZone).toHaveBeenCalledWith("sz-001"),
      );
      expect(svc.deleteSafeZone).toHaveBeenCalledTimes(1);

      await waitFor(() =>
        expect(
          screen.queryByText("Central Police Station"),
        ).not.toBeInTheDocument(),
      );
    });

    it("does NOT call deleteSafeZone when the user cancels", async () => {
      const user = userEvent.setup();
      render(<SafeZonesPage />);
      await waitFor(() =>
        expect(screen.getByText("Central Police Station")).toBeInTheDocument(),
      );

      await user.click(screen.getByTitle("delete"));
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(svc.deleteSafeZone).not.toHaveBeenCalled();
      expect(screen.getByText("Central Police Station")).toBeInTheDocument();
    });
  });

  describe("EMERGENCY-UC-06 — Add Safe Zone", () => {
    it("submits a new safe zone with name + chosen coordinates + radius", async () => {
      const user = userEvent.setup();
      svc.createSafeZone.mockResolvedValue({
        id: "sz-new",
        createdAtMs: Date.now(),
      });

      render(<SafeZonesPage />);
      await waitFor(() =>
        expect(screen.getByText("Central Police Station")).toBeInTheDocument(),
      );

      // Open modal.
      await user.click(screen.getByRole("button", { name: /addZone/i }));

      // Modal title from translation mock.
      expect(screen.getByText("modalTitle")).toBeInTheDocument();

      // Form labels are NOT bound via htmlFor, so we scope queries to the modal.
      const modal = screen
        .getByText("modalTitle")
        .closest("div.bg-white") as HTMLElement;
      const textboxes = within(modal).getAllByRole("textbox");
      const [nameInput] = textboxes;
      await user.type(nameInput, "New North Station");

      // Pick a location through the stubbed MapView.
      await user.click(screen.getByTestId("map-click"));

      // Set radius (number → spinbutton role).
      const radiusInput = within(modal).getByRole("spinbutton");
      await user.clear(radiusInput);
      await user.type(radiusInput, "750");

      // Confirm.
      await user.click(within(modal).getByRole("button", { name: "confirm" }));

      await waitFor(() => expect(svc.createSafeZone).toHaveBeenCalledTimes(1));
      expect(svc.createSafeZone).toHaveBeenCalledWith({
        name: "New North Station",
        latitudeDegrees: 10.776,
        longitudeDegrees: 106.7,
        radiusMeters: 750,
      });
    });

    it("disables the confirm button when name or radius is empty", async () => {
      const user = userEvent.setup();
      render(<SafeZonesPage />);
      await waitFor(() =>
        expect(screen.getByText("Central Police Station")).toBeInTheDocument(),
      );

      await user.click(screen.getByRole("button", { name: /addZone/i }));

      const modal = screen
        .getByText("modalTitle")
        .closest("div.bg-white") as HTMLElement;
      const confirmBtn = within(modal).getByRole("button", { name: "confirm" });

      // Name is empty by default → confirm disabled.
      expect(confirmBtn).toBeDisabled();

      // Note: SafeZonesPage seeds `selectedLocation` to DEFAULT_CENTER on open,
      // so location is already set. Typing a name should be enough to enable.
      const nameInput = within(modal).getAllByRole("textbox")[0];
      await user.type(nameInput, "X");
      expect(confirmBtn).toBeEnabled();

      // Clearing radius disables again.
      const radiusInput = within(modal).getByRole("spinbutton");
      await user.clear(radiusInput);
      expect(confirmBtn).toBeDisabled();
    });
  });
});
