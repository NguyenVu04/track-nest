import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { User } from "@/types";

// ── Navigation mock ──────────────────────────────────────────────────────────

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = { id: "person-1" };

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  usePathname: () => "/dashboard/missing-persons",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => mockParams,
}));

// ── Context mocks ─────────────────────────────────────────────────────────────

let mockUser: User | null = null;

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

const mockAddNotification = jest.fn();

jest.mock("@/contexts/NotificationContext", () => ({
  useNotification: () => ({ addNotification: mockAddNotification }),
}));

// ── Service mock ─────────────────────────────────────────────────────────────

const mockListMissingPersonReports = jest.fn();
const mockPublishMissingPersonReport = jest.fn();
const mockDeleteMissingPersonReport = jest.fn();
const mockGetMissingPersonReport = jest.fn();
const mockGetFileUrl = jest.fn();
const mockGetMissingPersonPhotoUrl = jest.fn();

jest.mock("@/services/criminalReportsService", () => ({
  criminalReportsService: {
    listMissingPersonReports: (...args: unknown[]) =>
      mockListMissingPersonReports(...args),
    publishMissingPersonReport: (...args: unknown[]) =>
      mockPublishMissingPersonReport(...args),
    deleteMissingPersonReport: (...args: unknown[]) =>
      mockDeleteMissingPersonReport(...args),
    getMissingPersonReport: (...args: unknown[]) =>
      mockGetMissingPersonReport(...args),
    getFileUrl: (...args: unknown[]) => mockGetFileUrl(...args),
    getMissingPersonPhotoUrl: (...args: unknown[]) =>
      mockGetMissingPersonPhotoUrl(...args),
  },
}));

// ── Component mocks ──────────────────────────────────────────────────────────

jest.mock("use-debounce", () => ({
  useDebouncedCallback: (fn: (...args: unknown[]) => void) => fn,
}));

jest.mock("@/components/missing-persons/MissingPersonList", () => ({
  MissingPersonList: ({
    persons,
    onViewDetail,
    onPublish,
    onDelete,
  }: {
    persons: { id: string; fullName: string }[];
    onViewDetail: (p: { id: string }) => void;
    onPublish: (id: string) => void;
    onDelete: (id: string) => void;
  }) => (
    <div data-testid="missing-person-list">
      {persons.map((p) => (
        <div key={p.id} data-testid={`person-${p.id}`}>
          <span>{p.fullName}</span>
          <button onClick={() => onViewDetail(p)} data-testid={`view-${p.id}`}>View</button>
          <button onClick={() => onPublish(p.id)} data-testid={`publish-${p.id}`}>Publish</button>
          <button onClick={() => onDelete(p.id)} data-testid={`delete-${p.id}`}>Delete</button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock("@/components/missing-persons/MissingPersonDetail", () => ({
  MissingPersonDetail: ({
    person,
    onBack,
    onEdit,
    onPublish,
    onDelete,
  }: {
    person: { id: string; fullName: string };
    onBack: () => void;
    onEdit: (p: { id: string }) => void;
    onPublish: (id: string) => void;
    onDelete: (id: string) => void;
  }) => (
    <div data-testid="missing-person-detail">
      <span>{person.fullName}</span>
      <button onClick={onBack} data-testid="back-btn">Back</button>
      <button onClick={() => onEdit(person)} data-testid="edit-btn">Edit</button>
      <button onClick={() => onPublish(person.id)} data-testid="publish-btn">Publish</button>
      <button onClick={() => onDelete(person.id)} data-testid="delete-btn">Delete</button>
    </div>
  ),
}));

jest.mock("@/components/missing-persons/MissingPersonForm", () => ({
  MissingPersonForm: ({
    mode,
    onSave,
    onCancel,
  }: {
    mode: string;
    person: unknown;
    onSave: (p: { id: string }) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="missing-person-form">
      <span data-testid="form-mode">{mode}</span>
      <button onClick={() => onSave({ id: "person-1" })} data-testid="save-btn">Save</button>
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

jest.mock("@/components/animations/PageTransition", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-transition">{children}</div>
  ),
}));

// ── Test data ─────────────────────────────────────────────────────────────────

const reporterUser: User = {
  id: "u1",
  username: "reporter",
  email: "reporter@test.com",
  fullName: "Reporter User",
  role: ["Reporter"],
};

const mockPerson = {
  id: "person-1",
  title: "Missing: John Doe",
  fullName: "John Doe",
  personalId: "ID123",
  photo: "photo.jpg",
  date: "2024-01-01",
  content: "<p>Details</p>",
  contentDocId: "doc-1",
  contactEmail: "contact@test.com",
  contactPhone: "0901234567",
  createdAt: "2024-01-01T00:00:00Z",
  userId: "u2",
  status: "PENDING",
  reporterId: "u1",
  isPublic: false,
  latitude: 10.0,
  longitude: 106.0,
};

const mockPageResponse = {
  content: [mockPerson],
  totalElements: 1,
  totalPages: 1,
  size: 100,
  page: 0,
};

// ── Getters ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const MissingPersonsListPage = (require("@/app/dashboard/missing-persons/page") as { default: React.ComponentType }).default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MissingPersonDetailPage = (require("@/app/dashboard/missing-persons/[id]/page") as { default: React.ComponentType }).default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const CreateMissingPersonPage = (require("@/app/dashboard/missing-persons/create/page") as { default: React.ComponentType }).default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EditMissingPersonPage = (require("@/app/dashboard/missing-persons/[id]/edit/page") as { default: React.ComponentType }).default;

beforeEach(() => {
  mockUser = { ...reporterUser };
  mockParams = { id: "person-1" };
  jest.clearAllMocks();
  mockListMissingPersonReports.mockResolvedValue(mockPageResponse);
  mockPublishMissingPersonReport.mockResolvedValue({
    status: "PUBLISHED",
    isPublic: true,
  });
  mockDeleteMissingPersonReport.mockResolvedValue(undefined);
  mockGetMissingPersonReport.mockResolvedValue(mockPerson);
  mockGetFileUrl.mockResolvedValue("https://cdn.example.com/file.html");
  mockGetMissingPersonPhotoUrl.mockReturnValue(
    "https://cdn.example.com/photo.jpg",
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// MissingPersonsPage (list)
// ═══════════════════════════════════════════════════════════════════════════

describe("MissingPersonsPage — null user", () => {
  it("returns null when user is null", () => {
    mockUser = null;
    const { container } = render(<MissingPersonsListPage />);
    expect(container.firstChild).toBeNull();
  });
});

describe("MissingPersonsPage — loading state", () => {
  it("shows fullscreen loader while fetching", () => {
    mockListMissingPersonReports.mockReturnValue(new Promise(() => {}));
    render(<MissingPersonsListPage />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });
});

describe("MissingPersonsPage — loaded state", () => {
  it("renders MissingPersonList after loading", async () => {
    render(<MissingPersonsListPage />);
    await waitFor(() =>
      expect(screen.getByTestId("missing-person-list")).toBeInTheDocument(),
    );
  });

  it("renders person full name", async () => {
    render(<MissingPersonsListPage />);
    await waitFor(() =>
      expect(screen.getByText("John Doe")).toBeInTheDocument(),
    );
  });

  it("renders breadcrumbs", async () => {
    render(<MissingPersonsListPage />);
    await waitFor(() =>
      expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument(),
    );
  });

  it("navigates to detail page when view clicked", async () => {
    render(<MissingPersonsListPage />);
    await waitFor(() => screen.getByTestId("view-person-1"));
    fireEvent.click(screen.getByTestId("view-person-1"));
    expect(mockPush).toHaveBeenCalledWith(
      "/dashboard/missing-persons/person-1",
    );
  });

  it("navigates to create page when New Report clicked", async () => {
    render(<MissingPersonsListPage />);
    await waitFor(() => screen.getByText("newReport"));
    fireEvent.click(screen.getByText("newReport"));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/missing-persons/create");
  });

  it("calls publishMissingPersonReport and addNotification on publish", async () => {
    render(<MissingPersonsListPage />);
    await waitFor(() => screen.getByTestId("publish-person-1"));
    fireEvent.click(screen.getByTestId("publish-person-1"));
    await waitFor(() => {
      expect(mockPublishMissingPersonReport).toHaveBeenCalledWith("person-1");
      expect(mockAddNotification).toHaveBeenCalled();
    });
  });

  it("calls deleteMissingPersonReport and addNotification on delete", async () => {
    render(<MissingPersonsListPage />);
    await waitFor(() => screen.getByTestId("delete-person-1"));
    fireEvent.click(screen.getByTestId("delete-person-1"));
    await waitFor(() => {
      expect(mockDeleteMissingPersonReport).toHaveBeenCalledWith("person-1");
      expect(mockAddNotification).toHaveBeenCalled();
    });
  });

  it("shows toast error when listMissingPersonReports fails", async () => {
    mockListMissingPersonReports.mockRejectedValue(new Error("Network error"));
    const { toast } = require("sonner");
    render(<MissingPersonsListPage />);
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MissingPersonDetailPage
// ═══════════════════════════════════════════════════════════════════════════

describe("MissingPersonDetailPage — null user", () => {
  it("returns null when user is null", () => {
    mockUser = null;
    const { container } = render(<MissingPersonDetailPage />);
    expect(container.firstChild).toBeNull();
  });
});

describe("MissingPersonDetailPage — loading state", () => {
  it("shows loader while fetching", () => {
    mockGetMissingPersonReport.mockReturnValue(new Promise(() => {}));
    render(<MissingPersonDetailPage />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });
});

describe("MissingPersonDetailPage — loaded state", () => {
  it("renders MissingPersonDetail after loading", async () => {
    render(<MissingPersonDetailPage />);
    await waitFor(() =>
      expect(screen.getByTestId("missing-person-detail")).toBeInTheDocument(),
    );
  });

  it("renders person full name in detail", async () => {
    render(<MissingPersonDetailPage />);
    await waitFor(() =>
      expect(screen.getByText("John Doe")).toBeInTheDocument(),
    );
  });

  it("calls router.back when back clicked", async () => {
    render(<MissingPersonDetailPage />);
    await waitFor(() => screen.getByTestId("back-btn"));
    fireEvent.click(screen.getByTestId("back-btn"));
    expect(mockBack).toHaveBeenCalled();
  });

  it("navigates to edit page when edit clicked", async () => {
    render(<MissingPersonDetailPage />);
    await waitFor(() => screen.getByTestId("edit-btn"));
    fireEvent.click(screen.getByTestId("edit-btn"));
    expect(mockPush).toHaveBeenCalledWith(
      "/dashboard/missing-persons/person-1/edit",
    );
  });

  it("calls publishMissingPersonReport and addNotification when publish triggered", async () => {
    render(<MissingPersonDetailPage />);
    await waitFor(() => screen.getByTestId("publish-btn"));
    fireEvent.click(screen.getByTestId("publish-btn"));
    await waitFor(() => {
      expect(mockPublishMissingPersonReport).toHaveBeenCalledWith("person-1");
      expect(mockAddNotification).toHaveBeenCalled();
    });
  });

  it("calls deleteMissingPersonReport and navigates when delete triggered", async () => {
    render(<MissingPersonDetailPage />);
    await waitFor(() => screen.getByTestId("delete-btn"));
    fireEvent.click(screen.getByTestId("delete-btn"));
    await waitFor(() => {
      expect(mockDeleteMissingPersonReport).toHaveBeenCalledWith("person-1");
      expect(mockPush).toHaveBeenCalledWith("/dashboard/missing-persons");
    });
  });

  it("shows Not Found when getMissingPersonReport fails", async () => {
    mockGetMissingPersonReport.mockRejectedValue(new Error("Not found"));
    render(<MissingPersonDetailPage />);
    await waitFor(() =>
      expect(
        screen.getByText("Missing Person Not Found"),
      ).toBeInTheDocument(),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CreateMissingPersonPage
// ═══════════════════════════════════════════════════════════════════════════

describe("CreateMissingPersonPage — null user", () => {
  it("shows Unauthorized when user is null", () => {
    mockUser = null;
    render(<CreateMissingPersonPage />);
    expect(screen.getByText("Unauthorized")).toBeInTheDocument();
  });

  it("renders go-back button when unauthorized", () => {
    mockUser = null;
    render(<CreateMissingPersonPage />);
    expect(screen.getByText("← Go Back")).toBeInTheDocument();
  });

  it("calls router.back on go-back click", () => {
    mockUser = null;
    render(<CreateMissingPersonPage />);
    fireEvent.click(screen.getByText("← Go Back"));
    expect(mockBack).toHaveBeenCalled();
  });
});

describe("CreateMissingPersonPage — authenticated", () => {
  it("renders MissingPersonForm in create mode", () => {
    render(<CreateMissingPersonPage />);
    expect(screen.getByTestId("missing-person-form")).toBeInTheDocument();
    expect(screen.getByTestId("form-mode")).toHaveTextContent("create");
  });

  it("navigates to list after save", () => {
    render(<CreateMissingPersonPage />);
    fireEvent.click(screen.getByTestId("save-btn"));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/missing-persons");
  });

  it("calls router.back on cancel", () => {
    render(<CreateMissingPersonPage />);
    fireEvent.click(screen.getByTestId("cancel-btn"));
    expect(mockBack).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// EditMissingPersonPage
// ═══════════════════════════════════════════════════════════════════════════

describe("EditMissingPersonPage — null user", () => {
  it("returns null when user is null", () => {
    mockUser = null;
    const { container } = render(<EditMissingPersonPage />);
    expect(container.firstChild).toBeNull();
  });
});

describe("EditMissingPersonPage — loading state", () => {
  it("shows loader while fetching", () => {
    mockGetMissingPersonReport.mockReturnValue(new Promise(() => {}));
    render(<EditMissingPersonPage />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });
});

describe("EditMissingPersonPage — loaded state", () => {
  it("renders MissingPersonForm in edit mode", async () => {
    render(<EditMissingPersonPage />);
    await waitFor(() => {
      expect(screen.getByTestId("missing-person-form")).toBeInTheDocument();
      expect(screen.getByTestId("form-mode")).toHaveTextContent("edit");
    });
  });

  it("navigates to detail page after save", async () => {
    render(<EditMissingPersonPage />);
    await waitFor(() => screen.getByTestId("save-btn"));
    fireEvent.click(screen.getByTestId("save-btn"));
    expect(mockPush).toHaveBeenCalledWith(
      "/dashboard/missing-persons/person-1",
    );
  });

  it("calls router.back on cancel", async () => {
    render(<EditMissingPersonPage />);
    await waitFor(() => screen.getByTestId("cancel-btn"));
    fireEvent.click(screen.getByTestId("cancel-btn"));
    expect(mockBack).toHaveBeenCalled();
  });

  it("shows Not Found when getMissingPersonReport fails", async () => {
    mockGetMissingPersonReport.mockRejectedValue(new Error("Not found"));
    render(<EditMissingPersonPage />);
    await waitFor(() =>
      expect(
        screen.getByText("Missing Person Not Found"),
      ).toBeInTheDocument(),
    );
  });
});
