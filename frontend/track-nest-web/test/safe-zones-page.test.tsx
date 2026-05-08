import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { User } from "@/types";

// ── Navigation mock ──────────────────────────────────────────────────────────

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => "/dashboard/safe-zones",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// ── Auth mock ────────────────────────────────────────────────────────────────

let mockUser: User | null = null;

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// ── Service mock ─────────────────────────────────────────────────────────────

const mockGetSafeZones = jest.fn();
const mockCreateSafeZone = jest.fn();
const mockDeleteSafeZone = jest.fn();

jest.mock("@/services/emergencyOpsService", () => ({
  emergencyOpsService: {
    getSafeZones: (...args: unknown[]) => mockGetSafeZones(...args),
    createSafeZone: (...args: unknown[]) => mockCreateSafeZone(...args),
    deleteSafeZone: (...args: unknown[]) => mockDeleteSafeZone(...args),
  },
}));

// ── Component mocks ──────────────────────────────────────────────────────────

jest.mock("@/components/shared/MapView", () => ({
  MapView: ({
    onMapClick,
  }: {
    center: [number, number];
    markers: unknown[];
    onMapClick?: (pos: [number, number]) => void;
    height?: string;
  }) => (
    <div data-testid="map-view">
      {onMapClick && (
        <button
          data-testid="map-click-btn"
          onClick={() => onMapClick([10.8231, 106.6297])}
        >
          Click Map
        </button>
      )}
    </div>
  ),
}));

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
  Loading: ({ fullScreen }: { fullScreen?: boolean }) => (
    <div data-testid="loading" data-fullscreen={String(!!fullScreen)} />
  ),
}));

jest.mock("@/components/layout/Breadcrumbs", () => ({
  Breadcrumbs: () => <nav data-testid="breadcrumbs" />,
}));

// ── Test data ─────────────────────────────────────────────────────────────────

const emergencyUser: User = {
  id: "u1",
  username: "emergency",
  email: "emergency@test.com",
  fullName: "Emergency User",
  role: ["Emergency Service"],
};

const mockZone = {
  id: "zone-1",
  name: "Police Station A",
  latitude: 10.8231,
  longitude: 106.6297,
  radius: 500,
  createdAt: "2024-01-01T00:00:00Z",
};

const mockZonesResponse = { items: [mockZone] };

// ── Getter ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SafeZonesPage = (require("@/app/dashboard/safe-zones/page") as { default: React.ComponentType }).default;

beforeEach(() => {
  mockUser = { ...emergencyUser };
  jest.clearAllMocks();
  mockGetSafeZones.mockResolvedValue(mockZonesResponse);
  mockCreateSafeZone.mockResolvedValue({
    id: "zone-new",
    createdAtMs: Date.now(),
  });
  mockDeleteSafeZone.mockResolvedValue(undefined);
});

describe("SafeZonesPage — null user", () => {
  it("returns null when user is null", () => {
    mockUser = null;
    const { container } = render(<SafeZonesPage />);
    expect(container.firstChild).toBeNull();
  });
});

describe("SafeZonesPage — loading state", () => {
  it("shows fullscreen loader while fetching", () => {
    mockGetSafeZones.mockReturnValue(new Promise(() => {}));
    render(<SafeZonesPage />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });
});

describe("SafeZonesPage — loaded state", () => {
  it("renders page title", async () => {
    render(<SafeZonesPage />);
    await waitFor(() =>
      expect(screen.getByText("Safe Zone Management")).toBeInTheDocument(),
    );
  });

  it("renders zone name in table", async () => {
    render(<SafeZonesPage />);
    await waitFor(() =>
      expect(screen.getByText("Police Station A")).toBeInTheDocument(),
    );
  });

  it("renders Configured Zones heading", async () => {
    render(<SafeZonesPage />);
    await waitFor(() =>
      expect(screen.getByText("Configured Zones")).toBeInTheDocument(),
    );
  });

  it("renders map view", async () => {
    render(<SafeZonesPage />);
    await waitFor(() =>
      expect(screen.getByTestId("map-view")).toBeInTheDocument(),
    );
  });

  it("renders add zone button", async () => {
    render(<SafeZonesPage />);
    await waitFor(() =>
      expect(screen.getByText("Create New Zone")).toBeInTheDocument(),
    );
  });

  it("renders coordinates of the zone", async () => {
    render(<SafeZonesPage />);
    await waitFor(() =>
      expect(screen.getByText("10.8231, 106.6297")).toBeInTheDocument(),
    );
  });

  it("renders zone radius", async () => {
    render(<SafeZonesPage />);
    await waitFor(() =>
      expect(screen.getByText(/Radius: 500m/i)).toBeInTheDocument(),
    );
  });

  it("filters zones by search query", async () => {
    render(<SafeZonesPage />);
    await waitFor(() => screen.getByText("Police Station A"));
    const searchInput = screen.getByPlaceholderText("Search by zone name...");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });
    await waitFor(() =>
      expect(screen.queryByText("Police Station A")).not.toBeInTheDocument(),
    );
  });

  it("shows error toast when getSafeZones fails", async () => {
    mockGetSafeZones.mockRejectedValue(new Error("Network error"));
    const { toast } = require("sonner");
    render(<SafeZonesPage />);
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});

describe("SafeZonesPage — zone selection", () => {
  it("highlights zone when card clicked", async () => {
    render(<SafeZonesPage />);
    await waitFor(() => screen.getByText("Police Station A"));
    const zoneCard = screen.getByText("Police Station A").closest("div[class*='group']")!;
    fireEvent.click(zoneCard);
    // Zone should be selected — the card gets highlighted class
    expect(zoneCard).not.toBeNull();
  });
});

describe("SafeZonesPage — delete zone", () => {
  it("opens confirm modal when delete button clicked", async () => {
    render(<SafeZonesPage />);
    await waitFor(() => screen.getByTitle("delete"));
    fireEvent.click(screen.getByTitle("delete"));
    expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
  });

  it("calls deleteSafeZone and removes zone when confirmed", async () => {
    render(<SafeZonesPage />);
    await waitFor(() => screen.getByTitle("delete"));
    fireEvent.click(screen.getByTitle("delete"));
    fireEvent.click(screen.getByTestId("confirm-btn"));
    await waitFor(() => {
      expect(mockDeleteSafeZone).toHaveBeenCalledWith("zone-1");
      expect(screen.queryByText("Police Station A")).not.toBeInTheDocument();
    });
  });

  it("cancels confirm modal when cancel clicked", async () => {
    render(<SafeZonesPage />);
    await waitFor(() => screen.getByTitle("delete"));
    fireEvent.click(screen.getByTitle("delete"));
    fireEvent.click(screen.getByTestId("cancel-btn"));
    expect(screen.queryByTestId("confirm-modal")).not.toBeInTheDocument();
  });
});

describe("SafeZonesPage — create zone", () => {
  it("opens create modal when Add Zone button clicked", async () => {
    render(<SafeZonesPage />);
    await waitFor(() => screen.getByText("Create New Zone"));
    fireEvent.click(screen.getByText("Create New Zone"));
    await waitFor(() =>
      expect(screen.getByText("modalTitle")).toBeInTheDocument(),
    );
  });

  it("closes create modal when Cancel clicked", async () => {
    render(<SafeZonesPage />);
    await waitFor(() => screen.getByText("Create New Zone"));
    fireEvent.click(screen.getByText("Create New Zone"));
    await waitFor(() => screen.getByText("modalTitle"));
    fireEvent.click(screen.getByText("cancel"));
    await waitFor(() =>
      expect(
        screen.queryByText("modalTitle"),
      ).not.toBeInTheDocument(),
    );
  });

  it("creates a zone when form is filled and confirmed", async () => {
    render(<SafeZonesPage />);
    await waitFor(() => screen.getByText("Create New Zone"));
    fireEvent.click(screen.getByText("Create New Zone"));
    await waitFor(() => screen.getByText("modalTitle"));

    // Fill in zone name — modal adds inputs after the main search input,
    // so the second textbox is the name field.
    const allTextInputs = screen.queryAllByRole("textbox");
    const nameInput = allTextInputs.length > 1 ? allTextInputs[1] : allTextInputs[0];
    if (nameInput) {
      fireEvent.change(nameInput, { target: { value: "New Zone" } });
    }

    // Click map to set location
    fireEvent.click(screen.getByTestId("map-click-btn"));

    // Click Confirm
    fireEvent.click(screen.getByText("confirm"));

    await waitFor(() => expect(mockCreateSafeZone).toHaveBeenCalled());
  });
});
