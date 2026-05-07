import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { User } from "@/types";

// ── Navigation mock ──────────────────────────────────────────────────────────

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = { id: "guide-1" };

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  usePathname: () => "/dashboard/guidelines",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => mockParams,
}));

// ── Auth mock ────────────────────────────────────────────────────────────────

let mockUser: User | null = null;

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// ── Service mock ─────────────────────────────────────────────────────────────

const mockListGuidelinesDocuments = jest.fn();
const mockDeleteGuidelinesDocument = jest.fn();
const mockGetGuidelinesDocument = jest.fn();
const mockPublishGuidelinesDocument = jest.fn();
const mockCreateGuidelinesDocument = jest.fn();
const mockGetFileUrl = jest.fn();

jest.mock("@/services/criminalReportsService", () => ({
  criminalReportsService: {
    listGuidelinesDocuments: (...args: unknown[]) =>
      mockListGuidelinesDocuments(...args),
    deleteGuidelinesDocument: (...args: unknown[]) =>
      mockDeleteGuidelinesDocument(...args),
    getGuidelinesDocument: (...args: unknown[]) =>
      mockGetGuidelinesDocument(...args),
    publishGuidelinesDocument: (...args: unknown[]) =>
      mockPublishGuidelinesDocument(...args),
    createGuidelinesDocument: (...args: unknown[]) =>
      mockCreateGuidelinesDocument(...args),
    getFileUrl: (...args: unknown[]) => mockGetFileUrl(...args),
  },
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

jest.mock("@/components/shared/ChatbotPanel", () => ({
  ChatbotPanel: () => <div data-testid="chatbot-panel" />,
}));

jest.mock("@/components/loading/Loading", () => ({
  Loading: ({ fullScreen }: { fullScreen?: boolean }) => (
    <div data-testid="loading" data-fullscreen={String(!!fullScreen)} />
  ),
}));

jest.mock("@/components/shared/RichTextEditor", () => ({
  RichTextEditor: ({
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    height?: number;
  }) => (
    <textarea
      data-testid="rich-text-editor"
      onChange={(e) => onChange(e.target.value)}
    />
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

const mockGuideline = {
  id: "guide-1",
  title: "Safety Guidelines",
  abstractText: "Important safety info",
  content: "<p>Content here</p>",
  contentDocId: "doc-1",
  createdAt: "2024-01-01T00:00:00Z",
  reporterId: "u1",
  isPublic: false,
};

const mockPageResponse = {
  content: [mockGuideline],
  totalElements: 1,
  totalPages: 1,
  size: 100,
  page: 0,
};

// ── Page components ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const GuidelinesListPage = (require("@/app/dashboard/guidelines/page") as { default: React.ComponentType }).default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const GuidelineDetailPage = (require("@/app/dashboard/guidelines/[id]/page") as { default: React.ComponentType }).default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const CreateGuidelinePage = (require("@/app/dashboard/guidelines/create/page") as { default: React.ComponentType }).default;

beforeEach(() => {
  mockUser = { ...reporterUser };
  mockParams = { id: "guide-1" };
  jest.clearAllMocks();
  mockListGuidelinesDocuments.mockResolvedValue(mockPageResponse);
  mockDeleteGuidelinesDocument.mockResolvedValue(undefined);
  mockGetGuidelinesDocument.mockResolvedValue(mockGuideline);
  mockPublishGuidelinesDocument.mockResolvedValue({ id: "guide-1", isPublic: true });
  mockCreateGuidelinesDocument.mockResolvedValue({ id: "new-guide" });
  mockGetFileUrl.mockResolvedValue("https://cdn.example.com/file.html");
});

// ═══════════════════════════════════════════════════════════════════════════
// GuidelinesPage (list)
// ═══════════════════════════════════════════════════════════════════════════

describe("GuidelinesPage — null user", () => {
  it("returns null when user is null", () => {
    mockUser = null;
    const { container } = render(<GuidelinesListPage />);
    expect(container.firstChild).toBeNull();
  });
});

describe("GuidelinesPage — loading state", () => {
  it("shows fullscreen loader while fetching", () => {
    mockListGuidelinesDocuments.mockReturnValue(new Promise(() => {}));
    render(<GuidelinesListPage />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });
});

describe("GuidelinesPage — loaded state", () => {
  it("renders System Guidelines heading", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() =>
      expect(screen.getByText("System Guidelines")).toBeInTheDocument(),
    );
  });

  it("renders guideline title", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() =>
      expect(screen.getByText("Safety Guidelines")).toBeInTheDocument(),
    );
  });

  it("renders guideline abstract", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() =>
      expect(screen.getByText("Important safety info")).toBeInTheDocument(),
    );
  });

  it("renders New Guideline button", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() =>
      expect(screen.getByText("New Guideline")).toBeInTheDocument(),
    );
  });

  it("navigates to create page when New Guideline clicked", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() => screen.getByText("New Guideline"));
    fireEvent.click(screen.getByText("New Guideline"));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/guidelines/create");
  });

  it("navigates to detail page when view button clicked", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() => screen.getByTitle("View Guideline"));
    fireEvent.click(screen.getByTitle("View Guideline"));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/guidelines/guide-1");
  });

  it("opens confirm modal when delete button clicked", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() => screen.getByTitle("Delete Guideline"));
    fireEvent.click(screen.getByTitle("Delete Guideline"));
    expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
  });

  it("calls deleteGuidelinesDocument when confirmed", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() => screen.getByTitle("Delete Guideline"));
    fireEvent.click(screen.getByTitle("Delete Guideline"));
    fireEvent.click(screen.getByTestId("confirm-btn"));
    await waitFor(() =>
      expect(mockDeleteGuidelinesDocument).toHaveBeenCalledWith("guide-1"),
    );
  });

  it("cancels confirm modal when cancel clicked", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() => screen.getByTitle("Delete Guideline"));
    fireEvent.click(screen.getByTitle("Delete Guideline"));
    fireEvent.click(screen.getByTestId("cancel-btn"));
    expect(screen.queryByTestId("confirm-modal")).not.toBeInTheDocument();
  });

  it("shows No guidelines found when list is empty", async () => {
    mockListGuidelinesDocuments.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 100,
      page: 0,
    });
    render(<GuidelinesListPage />);
    await waitFor(() =>
      expect(screen.getByText("No guidelines found.")).toBeInTheDocument(),
    );
  });

  it("filters guidelines by search query", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() => screen.getByText("Safety Guidelines"));
    const searchInput = screen.getByPlaceholderText("Search guidelines...");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });
    await waitFor(() =>
      expect(screen.queryByText("Safety Guidelines")).not.toBeInTheDocument(),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GuidelineDetailPage
// ═══════════════════════════════════════════════════════════════════════════

describe("GuidelineDetailPage — null user", () => {
  it("returns null when user is null", () => {
    mockUser = null;
    const { container } = render(<GuidelineDetailPage />);
    expect(container.firstChild).toBeNull();
  });
});

describe("GuidelineDetailPage — loading state", () => {
  it("shows loader while fetching", () => {
    mockGetGuidelinesDocument.mockReturnValue(new Promise(() => {}));
    render(<GuidelineDetailPage />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });
});

describe("GuidelineDetailPage — loaded state", () => {
  it("renders guideline title", async () => {
    render(<GuidelineDetailPage />);
    await waitFor(() =>
      expect(screen.getByText("Safety Guidelines")).toBeInTheDocument(),
    );
  });

  it("renders guideline abstract", async () => {
    render(<GuidelineDetailPage />);
    await waitFor(() =>
      expect(screen.getByText("Important safety info")).toBeInTheDocument(),
    );
  });

  it("renders ChatbotPanel", async () => {
    render(<GuidelineDetailPage />);
    await waitFor(() =>
      expect(screen.getByTestId("chatbot-panel")).toBeInTheDocument(),
    );
  });

  it("shows publish button when guideline is not public", async () => {
    render(<GuidelineDetailPage />);
    await waitFor(() =>
      expect(screen.getByTitle("Publish Guideline")).toBeInTheDocument(),
    );
  });

  it("calls publishGuidelinesDocument when publish button clicked", async () => {
    render(<GuidelineDetailPage />);
    await waitFor(() => screen.getByTitle("Publish Guideline"));
    fireEvent.click(screen.getByTitle("Publish Guideline"));
    await waitFor(() =>
      expect(mockPublishGuidelinesDocument).toHaveBeenCalledWith("guide-1"),
    );
  });

  it("shows confirm modal when delete button clicked", async () => {
    render(<GuidelineDetailPage />);
    await waitFor(() => screen.getByTitle("Delete Guideline"));
    fireEvent.click(screen.getByTitle("Delete Guideline"));
    expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
  });

  it("calls deleteGuidelinesDocument and navigates when confirmed", async () => {
    render(<GuidelineDetailPage />);
    await waitFor(() => screen.getByTitle("Delete Guideline"));
    fireEvent.click(screen.getByTitle("Delete Guideline"));
    fireEvent.click(screen.getByTestId("confirm-btn"));
    await waitFor(() => {
      expect(mockDeleteGuidelinesDocument).toHaveBeenCalledWith("guide-1");
      expect(mockPush).toHaveBeenCalledWith("/dashboard/guidelines");
    });
  });

  it("shows Guideline Not Found when fetch fails", async () => {
    mockGetGuidelinesDocument.mockRejectedValue(new Error("Not found"));
    render(<GuidelineDetailPage />);
    await waitFor(() =>
      expect(screen.getByText("Guideline Not Found")).toBeInTheDocument(),
    );
  });

  it("renders HTML content using dangerouslySetInnerHTML when content starts with <", async () => {
    render(<GuidelineDetailPage />);
    await waitFor(() => screen.getByText("Safety Guidelines"));
    // The content "<p>Content here</p>" is rendered via dangerouslySetInnerHTML
    expect(screen.getByText("Content here")).toBeInTheDocument();
  });

  it("renders iframe when content starts with http", async () => {
    mockGetGuidelinesDocument.mockResolvedValue({
      ...mockGuideline,
      content: "https://example.com/doc.html",
    });
    render(<GuidelineDetailPage />);
    await waitFor(() => screen.getByTitle("Guideline content"));
    expect(screen.getByTitle("Guideline content").tagName).toBe("IFRAME");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CreateGuidelinePage
// ═══════════════════════════════════════════════════════════════════════════

describe("CreateGuidelinePage — null user", () => {
  it("shows Unauthorized when user is null", () => {
    mockUser = null;
    render(<CreateGuidelinePage />);
    expect(screen.getByText("Unauthorized")).toBeInTheDocument();
  });

  it("renders go-back button when unauthorized", () => {
    mockUser = null;
    render(<CreateGuidelinePage />);
    expect(screen.getByText("← Go Back")).toBeInTheDocument();
  });
});

describe("CreateGuidelinePage — form", () => {
  it("renders New Guideline heading", () => {
    render(<CreateGuidelinePage />);
    expect(screen.getByText("New Guideline")).toBeInTheDocument();
  });

  it("renders title, abstract, and content fields", () => {
    render(<CreateGuidelinePage />);
    expect(screen.getByLabelText("Title *")).toBeInTheDocument();
    expect(screen.getByLabelText("Abstract / Description *")).toBeInTheDocument();
    expect(screen.getByTestId("rich-text-editor")).toBeInTheDocument();
  });

  it("allows filling in title and abstract", () => {
    render(<CreateGuidelinePage />);
    const titleInput = screen.getByLabelText("Title *");
    const abstractInput = screen.getByLabelText("Abstract / Description *");
    fireEvent.change(titleInput, { target: { value: "My Guide" } });
    fireEvent.change(abstractInput, { target: { value: "Summary" } });
    expect(titleInput).toHaveValue("My Guide");
    expect(abstractInput).toHaveValue("Summary");
  });

  it("renders Preview button in form", () => {
    render(<CreateGuidelinePage />);
    expect(screen.getByText("Preview")).toBeInTheDocument();
  });

  it("navigates to back on Cancel", () => {
    render(<CreateGuidelinePage />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockBack).toHaveBeenCalled();
  });

  it("transitions to preview mode on form submit", () => {
    render(<CreateGuidelinePage />);
    fireEvent.change(screen.getByLabelText("Title *"), {
      target: { value: "My Guide" },
    });
    fireEvent.submit(screen.getByText("Preview").closest("form")!);
    expect(screen.getByText(/Back to Edit/)).toBeInTheDocument();
  });
});

describe("CreateGuidelinePage — preview mode", () => {
  const renderAndPreview = async () => {
    render(<CreateGuidelinePage />);
    fireEvent.change(screen.getByLabelText("Title *"), {
      target: { value: "My Guide" },
    });
    fireEvent.change(screen.getByLabelText("Abstract / Description *"), {
      target: { value: "My Abstract" },
    });
    fireEvent.submit(screen.getByText("Preview").closest("form")!);
    await waitFor(() => screen.getByText(/Back to Edit/));
  };

  it("shows title in preview", async () => {
    await renderAndPreview();
    expect(screen.getByText("My Guide")).toBeInTheDocument();
  });

  it("shows abstract in preview", async () => {
    await renderAndPreview();
    expect(screen.getByText("My Abstract")).toBeInTheDocument();
  });

  it("shows Publish Guideline and Save as Draft buttons", async () => {
    await renderAndPreview();
    expect(screen.getByText("Publish Guideline")).toBeInTheDocument();
    expect(screen.getByText("Save as Draft")).toBeInTheDocument();
  });

  it("returns to form when Back to Edit clicked", async () => {
    await renderAndPreview();
    fireEvent.click(screen.getByText(/Back to Edit/));
    expect(screen.getByText("New Guideline")).toBeInTheDocument();
  });

  it("calls createGuidelinesDocument and publishGuidelinesDocument on Publish", async () => {
    await renderAndPreview();
    fireEvent.click(screen.getByText("Publish Guideline"));
    await waitFor(() => {
      expect(mockCreateGuidelinesDocument).toHaveBeenCalled();
      expect(mockPublishGuidelinesDocument).toHaveBeenCalledWith("new-guide");
      expect(mockPush).toHaveBeenCalledWith("/dashboard/guidelines");
    });
  });

  it("calls createGuidelinesDocument (without publish) on Save as Draft", async () => {
    await renderAndPreview();
    fireEvent.click(screen.getByText("Save as Draft"));
    await waitFor(() => {
      expect(mockCreateGuidelinesDocument).toHaveBeenCalled();
      expect(mockPublishGuidelinesDocument).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/dashboard/guidelines");
    });
  });
});
