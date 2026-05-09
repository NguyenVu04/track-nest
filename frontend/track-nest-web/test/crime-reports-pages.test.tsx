import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { User } from "@/types";

// ── Navigation mock ──────────────────────────────────────────────────────────

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = { id: "report-1" };

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  usePathname: () => "/dashboard/crime-reports",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => mockParams,
}));

// ── Auth mock ────────────────────────────────────────────────────────────────

let mockUser: User | null = null;

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// ── Service mock ─────────────────────────────────────────────────────────────

const mockListCrimeReports = jest.fn();
const mockPublishCrimeReport = jest.fn();
const mockDeleteCrimeReport = jest.fn();
const mockGetCrimeReport = jest.fn();
const mockGetFileUrl = jest.fn();
const mockUpdateCrimeReport = jest.fn();
const mockCreateCrimeReport = jest.fn();

jest.mock("@/services/criminalReportsService", () => ({
  criminalReportsService: {
    listCrimeReports: (...args: unknown[]) => mockListCrimeReports(...args),
    publishCrimeReport: (...args: unknown[]) => mockPublishCrimeReport(...args),
    deleteCrimeReport: (...args: unknown[]) => mockDeleteCrimeReport(...args),
    getCrimeReport: (...args: unknown[]) => mockGetCrimeReport(...args),
    getFileUrl: (...args: unknown[]) => mockGetFileUrl(...args),
    updateCrimeReport: (...args: unknown[]) => mockUpdateCrimeReport(...args),
    createCrimeReport: (...args: unknown[]) => mockCreateCrimeReport(...args),
  },
}));

// ── Component mocks ──────────────────────────────────────────────────────────

jest.mock("use-debounce", () => ({
  useDebouncedCallback: (fn: (...args: unknown[]) => void) => fn,
}));

jest.mock("@/components/crime-reports/CrimeReportList", () => ({
  CrimeReportList: ({
    reports,
    onPublish,
    onDelete,
    onViewDetail,
  }: {
    reports: { id: string; title: string }[];
    onPublish: (id: string) => void;
    onDelete: (id: string) => void;
    onViewDetail: (r: { id: string }) => void;
  }) => (
    <div data-testid="crime-report-list">
      {reports.map((r) => (
        <div key={r.id} data-testid={`report-${r.id}`}>
          <span>{r.title}</span>
          <button onClick={() => onViewDetail(r)} data-testid={`view-${r.id}`}>View</button>
          <button onClick={() => onPublish(r.id)} data-testid={`publish-${r.id}`}>Publish</button>
          <button onClick={() => onDelete(r.id)} data-testid={`delete-${r.id}`}>Delete</button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock("@/components/crime-reports/CrimeReportDetail", () => ({
  CrimeReportDetail: ({
    report,
    onBack,
    onEdit,
    onPublish,
    onDelete,
  }: {
    report: { id: string; title: string };
    onBack: () => void;
    onEdit: (r: { id: string }) => void;
    onPublish: (id: string) => void;
    onDelete: (id: string) => void;
  }) => (
    <div data-testid="crime-report-detail">
      <span>{report.title}</span>
      <button onClick={onBack} data-testid="back-btn">Back</button>
      <button onClick={() => onEdit(report)} data-testid="edit-btn">Edit</button>
      <button onClick={() => onPublish(report.id)} data-testid="publish-btn">Publish</button>
      <button onClick={() => onDelete(report.id)} data-testid="delete-btn">Delete</button>
    </div>
  ),
}));

jest.mock("@/components/crime-reports/CrimeReportForm", () => ({
  CrimeReportForm: ({
    mode,
    onSave,
    onCancel,
  }: {
    mode: string;
    report: unknown;
    onSave: (r: unknown) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="crime-report-form">
      <span data-testid="form-mode">{mode}</span>
      <button onClick={() => onSave({ id: "r1", title: "Test" })} data-testid="save-btn">Save</button>
      <button onClick={onCancel} data-testid="cancel-btn">Cancel</button>
    </div>
  ),
}));

jest.mock("@/components/crime-reports/CrimeHeatmapView", () => ({
  CrimeHeatmapView: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="heatmap-view">
      <button onClick={onBack} data-testid="heatmap-back">Back</button>
    </div>
  ),
}));

jest.mock("@/components/loading/Loading", () => ({
  Loading: ({ fullScreen }: { fullScreen?: boolean }) => (
    <div data-testid="loading" data-fullscreen={String(!!fullScreen)} />
  ),
}));

jest.mock("@/components/loading/LoadingCard", () => ({
  LoadingCard: () => <div data-testid="loading-card" />,
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

const mockReport = {
  id: "report-1",
  title: "Test Crime Report",
  content: "<p>Details</p>",
  contentDocId: "doc-1",
  severity: 3,
  date: "2024-01-01",
  longitude: 106.0,
  latitude: 10.0,
  numberOfVictims: 1,
  numberOfOffenders: 1,
  arrested: false,
  photos: [],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  reporterId: "u1",
  isPublic: false,
};

const mockPageResponse = {
  content: [mockReport],
  totalElements: 1,
  totalPages: 1,
  size: 100,
  page: 0,
};

// ── Page components ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const CrimeReportsListPage = (require("@/app/dashboard/crime-reports/page") as { default: React.ComponentType }).default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const CrimeReportDetailPage = (require("@/app/dashboard/crime-reports/[id]/page") as { default: React.ComponentType }).default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const CreateCrimeReportPage = (require("@/app/dashboard/crime-reports/create/page") as { default: React.ComponentType }).default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EditCrimeReportPage = (require("@/app/dashboard/crime-reports/[id]/edit/page") as { default: React.ComponentType }).default;

beforeEach(() => {
  mockUser = { ...reporterUser };
  mockParams = { id: "report-1" };
  jest.clearAllMocks();
  mockListCrimeReports.mockResolvedValue(mockPageResponse);
  mockPublishCrimeReport.mockResolvedValue(undefined);
  mockDeleteCrimeReport.mockResolvedValue(undefined);
  mockGetCrimeReport.mockResolvedValue(mockReport);
  mockGetFileUrl.mockResolvedValue("https://cdn.example.com/file.html");
  mockUpdateCrimeReport.mockResolvedValue(undefined);
  mockCreateCrimeReport.mockResolvedValue({ id: "new-report" });
});

// ═══════════════════════════════════════════════════════════════════════════
// CrimeReportsPage (list)
// ═══════════════════════════════════════════════════════════════════════════

describe("CrimeReportsPage — null user", () => {
  it("returns null when user is not authenticated", () => {
    mockUser = null;
    const { container } = render(<CrimeReportsListPage />);
    expect(container.firstChild).toBeNull();
  });
});

describe("CrimeReportsPage — loading state", () => {
  it("shows fullscreen loader initially", () => {
    mockListCrimeReports.mockReturnValue(new Promise(() => {}));
    render(<CrimeReportsListPage />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });
});

describe("CrimeReportsPage — loaded state", () => {
  it("renders CrimeReportList after loading", async () => {
    render(<CrimeReportsListPage />);
    await waitFor(() =>
      expect(screen.getByTestId("crime-report-list")).toBeInTheDocument(),
    );
  });

  it("renders report title after loading", async () => {
    render(<CrimeReportsListPage />);
    await waitFor(() =>
      expect(screen.getByText("Test Crime Report")).toBeInTheDocument(),
    );
  });

  it("renders breadcrumbs", async () => {
    render(<CrimeReportsListPage />);
    await waitFor(() =>
      expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument(),
    );
  });

  it("navigates to detail page when view detail is clicked", async () => {
    render(<CrimeReportsListPage />);
    await waitFor(() => screen.getByTestId("view-report-1"));
    fireEvent.click(screen.getByTestId("view-report-1"));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/crime-reports/report-1");
  });

  it("navigates to create page when Create Report button clicked", async () => {
    render(<CrimeReportsListPage />);
    await waitFor(() => screen.getByTestId("crime-report-list"));
    fireEvent.click(screen.getByText("Create Report"));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/crime-reports/create");
  });

  it("shows heatmap view when Heatmap button clicked", async () => {
    render(<CrimeReportsListPage />);
    await waitFor(() => screen.getByTestId("crime-report-list"));
    fireEvent.click(screen.getByText("heatmap"));
    await waitFor(() =>
      expect(screen.getByTestId("heatmap-view")).toBeInTheDocument(),
    );
  });

  it("returns to list from heatmap view", async () => {
    render(<CrimeReportsListPage />);
    await waitFor(() => screen.getByTestId("crime-report-list"));
    fireEvent.click(screen.getByText("heatmap"));
    fireEvent.click(screen.getByTestId("heatmap-back"));
    expect(screen.getByTestId("crime-report-list")).toBeInTheDocument();
  });

  it("calls publishCrimeReport when publish is triggered", async () => {
    render(<CrimeReportsListPage />);
    await waitFor(() => screen.getByTestId("publish-report-1"));
    fireEvent.click(screen.getByTestId("publish-report-1"));
    await waitFor(() =>
      expect(mockPublishCrimeReport).toHaveBeenCalledWith("report-1"),
    );
  });

  it("calls deleteCrimeReport when delete is triggered", async () => {
    render(<CrimeReportsListPage />);
    await waitFor(() => screen.getByTestId("delete-report-1"));
    fireEvent.click(screen.getByTestId("delete-report-1"));
    await waitFor(() =>
      expect(mockDeleteCrimeReport).toHaveBeenCalledWith("report-1"),
    );
  });

  it("shows toast error when listCrimeReports fails", async () => {
    mockListCrimeReports.mockRejectedValue(new Error("Network error"));
    const { toast } = require("sonner");
    render(<CrimeReportsListPage />);
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CrimeReportDetailPage
// ═══════════════════════════════════════════════════════════════════════════

describe("CrimeReportDetailPage — null user", () => {
  it("returns null when user is not set", () => {
    mockUser = null;
    const { container } = render(<CrimeReportDetailPage />);
    expect(container.firstChild).toBeNull();
  });
});

describe("CrimeReportDetailPage — loading state", () => {
  it("shows loader while fetching", () => {
    mockGetCrimeReport.mockReturnValue(new Promise(() => {}));
    render(<CrimeReportDetailPage />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });
});

describe("CrimeReportDetailPage — loaded state", () => {
  it("renders CrimeReportDetail after loading", async () => {
    render(<CrimeReportDetailPage />);
    await waitFor(() =>
      expect(screen.getByTestId("crime-report-detail")).toBeInTheDocument(),
    );
  });

  it("renders report title in detail", async () => {
    render(<CrimeReportDetailPage />);
    await waitFor(() =>
      expect(screen.getByText("Test Crime Report")).toBeInTheDocument(),
    );
  });

  it("calls router.back when back button is clicked", async () => {
    render(<CrimeReportDetailPage />);
    await waitFor(() => screen.getByTestId("back-btn"));
    fireEvent.click(screen.getByTestId("back-btn"));
    expect(mockBack).toHaveBeenCalled();
  });

  it("navigates to edit page when edit is clicked", async () => {
    render(<CrimeReportDetailPage />);
    await waitFor(() => screen.getByTestId("edit-btn"));
    fireEvent.click(screen.getByTestId("edit-btn"));
    expect(mockPush).toHaveBeenCalledWith(
      "/dashboard/crime-reports/report-1/edit",
    );
  });

  it("calls publishCrimeReport when publish is triggered", async () => {
    render(<CrimeReportDetailPage />);
    await waitFor(() => screen.getByTestId("publish-btn"));
    fireEvent.click(screen.getByTestId("publish-btn"));
    await waitFor(() =>
      expect(mockPublishCrimeReport).toHaveBeenCalledWith("report-1"),
    );
  });

  it("calls deleteCrimeReport and navigates when delete is triggered", async () => {
    render(<CrimeReportDetailPage />);
    await waitFor(() => screen.getByTestId("delete-btn"));
    fireEvent.click(screen.getByTestId("delete-btn"));
    await waitFor(() => {
      expect(mockDeleteCrimeReport).toHaveBeenCalledWith("report-1");
      expect(mockPush).toHaveBeenCalledWith("/dashboard/crime-reports");
    });
  });

  it("shows Not Found when getCrimeReport fails", async () => {
    mockGetCrimeReport.mockRejectedValue(new Error("Not found"));
    render(<CrimeReportDetailPage />);
    await waitFor(() =>
      expect(screen.getByText("Crime Report Not Found")).toBeInTheDocument(),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CreateCrimeReportPage
// ═══════════════════════════════════════════════════════════════════════════

describe("CreateCrimeReportPage — null user", () => {
  it("shows Unauthorized when user is null", () => {
    mockUser = null;
    render(<CreateCrimeReportPage />);
    expect(screen.getByText("Unauthorized")).toBeInTheDocument();
  });

  it("renders go-back button when unauthorized", () => {
    mockUser = null;
    render(<CreateCrimeReportPage />);
    expect(screen.getByText("← Go Back")).toBeInTheDocument();
  });

  it("calls router.back when go-back clicked", () => {
    mockUser = null;
    render(<CreateCrimeReportPage />);
    fireEvent.click(screen.getByText("← Go Back"));
    expect(mockBack).toHaveBeenCalled();
  });
});

describe("CreateCrimeReportPage — authenticated", () => {
  it("renders CrimeReportForm in create mode", () => {
    render(<CreateCrimeReportPage />);
    expect(screen.getByTestId("crime-report-form")).toBeInTheDocument();
    expect(screen.getByTestId("form-mode")).toHaveTextContent("create");
  });

  it("navigates to crime-reports list on save", async () => {
    render(<CreateCrimeReportPage />);
    fireEvent.click(screen.getByTestId("save-btn"));
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/dashboard/crime-reports"),
    );
  });

  it("calls router.back on cancel", () => {
    render(<CreateCrimeReportPage />);
    fireEvent.click(screen.getByTestId("cancel-btn"));
    expect(mockBack).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// EditCrimeReportPage
// ═══════════════════════════════════════════════════════════════════════════

describe("EditCrimeReportPage — null user", () => {
  it("returns null when user is null", () => {
    mockUser = null;
    const { container } = render(<EditCrimeReportPage />);
    expect(container.firstChild).toBeNull();
  });
});

describe("EditCrimeReportPage — loading state", () => {
  it("shows loader while fetching report", () => {
    mockGetCrimeReport.mockReturnValue(new Promise(() => {}));
    render(<EditCrimeReportPage />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });
});

describe("EditCrimeReportPage — loaded state", () => {
  it("renders CrimeReportForm in edit mode", async () => {
    render(<EditCrimeReportPage />);
    await waitFor(() => {
      expect(screen.getByTestId("crime-report-form")).toBeInTheDocument();
      expect(screen.getByTestId("form-mode")).toHaveTextContent("edit");
    });
  });

  it("calls updateCrimeReport and navigates on save", async () => {
    render(<EditCrimeReportPage />);
    await waitFor(() => screen.getByTestId("save-btn"));
    fireEvent.click(screen.getByTestId("save-btn"));
    await waitFor(() => {
      expect(mockUpdateCrimeReport).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/dashboard/crime-reports/report-1");
    });
  });

  it("calls router.back on cancel", async () => {
    render(<EditCrimeReportPage />);
    await waitFor(() => screen.getByTestId("cancel-btn"));
    fireEvent.click(screen.getByTestId("cancel-btn"));
    expect(mockBack).toHaveBeenCalled();
  });

  it("shows Not Found when getCrimeReport fails", async () => {
    mockGetCrimeReport.mockRejectedValue(new Error("Not found"));
    render(<EditCrimeReportPage />);
    await waitFor(() =>
      expect(screen.getByText("Crime Report Not Found")).toBeInTheDocument(),
    );
  });
});
