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

const mockDraftGuideline = {
  id: "guide-1",
  title: "Safety Guidelines",
  abstractText: "Important safety info",
  content: "<p>Content here</p>",
  contentDocId: "doc-1",
  createdAt: "2024-01-01T00:00:00Z",
  reporterId: "u1",
  isPublic: false,
};

const mockPublishedGuideline = {
  ...mockDraftGuideline,
  id: "guide-2",
  title: "Published Guide",
  isPublic: true,
};

const mockPageResponse = (items = [mockDraftGuideline]) => ({
  content: items,
  totalElements: items.length,
  totalPages: 1,
  size: 10,
  page: 0,
  first: true,
  last: true,
});

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
  mockListGuidelinesDocuments.mockResolvedValue(mockPageResponse());
  mockDeleteGuidelinesDocument.mockResolvedValue(undefined);
  mockGetGuidelinesDocument.mockResolvedValue(mockDraftGuideline);
  mockPublishGuidelinesDocument.mockResolvedValue({ id: "guide-1", isPublic: true });
  mockCreateGuidelinesDocument.mockResolvedValue({ id: "new-guide" });
  mockGetFileUrl.mockResolvedValue("https://cdn.example.com/file.html");
});

// ═══════════════════════════════════════════════════════════════════════════
// GuidelinesListPage — null / unauthenticated
// ═══════════════════════════════════════════════════════════════════════════

describe("GuidelinesListPage — null user", () => {
  it("returns null when user is null", () => {
    mockUser = null;
    const { container } = render(<GuidelinesListPage />);
    expect(container.firstChild).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GuidelinesListPage — loading
// ═══════════════════════════════════════════════════════════════════════════

describe("GuidelinesListPage — loading state", () => {
  it("shows loader while fetching", () => {
    mockListGuidelinesDocuments.mockReturnValue(new Promise(() => {}));
    render(<GuidelinesListPage />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GuidelinesListPage — loaded state (header & navigation)
// ═══════════════════════════════════════════════════════════════════════════

describe("GuidelinesListPage — header & navigation", () => {
  it("renders Safety Guidelines heading", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() =>
      expect(screen.getAllByText("Safety Guidelines").length).toBeGreaterThan(0),
    );
  });

  it("renders Create New Guideline button", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() =>
      expect(screen.getByText("Create New Guideline")).toBeInTheDocument(),
    );
  });

  it("navigates to create page when Create New Guideline clicked", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() => screen.getByText("Create New Guideline"));
    fireEvent.click(screen.getByText("Create New Guideline"));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/guidelines/create");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GuidelinesListPage — status filter tabs
// ═══════════════════════════════════════════════════════════════════════════

describe("GuidelinesListPage — status filter tabs", () => {
  it("renders All Guides, Published, and Drafts tabs", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() => screen.getByText("All Guides"));
    expect(screen.getByText("Published")).toBeInTheDocument();
    expect(screen.getByText("Drafts")).toBeInTheDocument();
  });

  it("calls listGuidelinesDocuments with isPublic=undefined when All Guides clicked", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() => screen.getByText("All Guides"));
    fireEvent.click(screen.getByText("All Guides"));
    await waitFor(() =>
      expect(mockListGuidelinesDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ isPublic: undefined }),
      ),
    );
  });

  it("calls listGuidelinesDocuments with isPublic=true when Published clicked", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() => screen.getByText("Published"));
    fireEvent.click(screen.getByText("Published"));
    await waitFor(() =>
      expect(mockListGuidelinesDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ isPublic: true }),
      ),
    );
  });

  it("calls listGuidelinesDocuments with isPublic=false when Drafts clicked", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() => screen.getByText("Drafts"));
    fireEvent.click(screen.getByText("Drafts"));
    await waitFor(() =>
      expect(mockListGuidelinesDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ isPublic: false }),
      ),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GuidelinesListPage — search
// ═══════════════════════════════════════════════════════════════════════════

describe("GuidelinesListPage — search input", () => {
  it("renders search input", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() =>
      expect(screen.getByPlaceholderText("Search guidelines…")).toBeInTheDocument(),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GuidelinesListPage — card rendering
// ═══════════════════════════════════════════════════════════════════════════

describe("GuidelinesListPage — card rendering", () => {
  it("renders guideline title in card", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() =>
      expect(screen.getAllByText("Safety Guidelines").length).toBeGreaterThan(0),
    );
  });

  it("renders guideline abstract in card", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() =>
      expect(screen.getByText("Important safety info")).toBeInTheDocument(),
    );
  });

  it("renders Draft badge for non-public guideline", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() =>
      expect(screen.getByText("Draft")).toBeInTheDocument(),
    );
  });

  it("renders Published badge for public guideline", async () => {
    mockListGuidelinesDocuments.mockResolvedValue(mockPageResponse([mockPublishedGuideline]));
    render(<GuidelinesListPage />);
    await waitFor(() =>
      expect(screen.getByText("Published")).toBeInTheDocument(),
    );
  });

  it("renders Continue button for draft guideline", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() =>
      expect(screen.getByText("Continue")).toBeInTheDocument(),
    );
  });

  it("navigates to detail page when Continue clicked (draft)", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() => screen.getByText("Continue"));
    fireEvent.click(screen.getByText("Continue"));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/guidelines/guide-1");
  });

  it("renders View and Edit buttons for published guideline", async () => {
    mockListGuidelinesDocuments.mockResolvedValue(mockPageResponse([mockPublishedGuideline]));
    render(<GuidelinesListPage />);
    await waitFor(() => screen.getByLabelText("View guideline"));
    expect(screen.getByLabelText("Edit guideline")).toBeInTheDocument();
  });

  it("navigates to detail page when View guideline clicked", async () => {
    mockListGuidelinesDocuments.mockResolvedValue(mockPageResponse([mockPublishedGuideline]));
    render(<GuidelinesListPage />);
    await waitFor(() => screen.getByLabelText("View guideline"));
    fireEvent.click(screen.getByLabelText("View guideline"));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/guidelines/guide-2");
  });

  it("navigates to edit page when Edit guideline clicked", async () => {
    mockListGuidelinesDocuments.mockResolvedValue(mockPageResponse([mockPublishedGuideline]));
    render(<GuidelinesListPage />);
    await waitFor(() => screen.getByLabelText("Edit guideline"));
    fireEvent.click(screen.getByLabelText("Edit guideline"));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/guidelines/guide-2/edit");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GuidelinesListPage — delete flow
// ═══════════════════════════════════════════════════════════════════════════

describe("GuidelinesListPage — delete flow", () => {
  it("opens confirm modal when delete button clicked", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() => screen.getByLabelText("Delete guideline"));
    fireEvent.click(screen.getByLabelText("Delete guideline"));
    expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
  });

  it("calls deleteGuidelinesDocument when confirmed", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() => screen.getByLabelText("Delete guideline"));
    fireEvent.click(screen.getByLabelText("Delete guideline"));
    fireEvent.click(screen.getByTestId("confirm-btn"));
    await waitFor(() =>
      expect(mockDeleteGuidelinesDocument).toHaveBeenCalledWith("guide-1"),
    );
  });

  it("closes confirm modal when cancel clicked", async () => {
    render(<GuidelinesListPage />);
    await waitFor(() => screen.getByLabelText("Delete guideline"));
    fireEvent.click(screen.getByLabelText("Delete guideline"));
    fireEvent.click(screen.getByTestId("cancel-btn"));
    expect(screen.queryByTestId("confirm-modal")).not.toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GuidelinesListPage — empty state
// ═══════════════════════════════════════════════════════════════════════════

describe("GuidelinesListPage — empty state", () => {
  it("shows empty state message when list is empty", async () => {
    mockListGuidelinesDocuments.mockResolvedValue(mockPageResponse([]));
    render(<GuidelinesListPage />);
    await waitFor(() =>
      expect(screen.getByText("No guidelines found in this section")).toBeInTheDocument(),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GuidelinesListPage — pagination
// ═══════════════════════════════════════════════════════════════════════════

describe("GuidelinesListPage — pagination", () => {
  it("shows pagination when totalPages > 0", async () => {
    mockListGuidelinesDocuments.mockResolvedValue({
      content: [mockDraftGuideline],
      totalElements: 25,
      totalPages: 3,
      size: 10,
      page: 0,
    });
    render(<GuidelinesListPage />);
    await waitFor(() => screen.getAllByText("Safety Guidelines"));
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows Showing X-Y of Z entries", async () => {
    mockListGuidelinesDocuments.mockResolvedValue({
      content: [mockDraftGuideline],
      totalElements: 25,
      totalPages: 3,
      size: 10,
      page: 0,
    });
    render(<GuidelinesListPage />);
    await waitFor(() =>
      expect(screen.getByText(/Showing/)).toBeInTheDocument(),
    );
    expect(screen.getByText(/25 entries/)).toBeInTheDocument();
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
  it("renders guideline title as heading", async () => {
    render(<GuidelineDetailPage />);
    await waitFor(() =>
      expect(screen.getAllByText("Safety Guidelines").length).toBeGreaterThan(0),
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

  it("shows Delete button", async () => {
    render(<GuidelineDetailPage />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Delete/i })).toBeInTheDocument(),
    );
  });

  it("shows Edit Guideline button", async () => {
    render(<GuidelineDetailPage />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Edit Guideline/i })).toBeInTheDocument(),
    );
  });

  it("shows confirm modal when Delete button clicked", async () => {
    render(<GuidelineDetailPage />);
    await waitFor(() => screen.getByRole("button", { name: /Delete/i }));
    fireEvent.click(screen.getByRole("button", { name: /Delete/i }));
    await waitFor(() =>
      expect(screen.getByTestId("confirm-modal")).toBeInTheDocument(),
    );
  });

  it("calls deleteGuidelinesDocument and navigates when confirmed", async () => {
    render(<GuidelineDetailPage />);
    await waitFor(() => screen.getByRole("button", { name: /Delete/i }));
    fireEvent.click(screen.getByRole("button", { name: /Delete/i }));
    await waitFor(() => screen.getByTestId("confirm-modal"));
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

  it("renders HTML content when content starts with <", async () => {
    render(<GuidelineDetailPage />);
    await waitFor(() => screen.getAllByText("Safety Guidelines"));
    expect(screen.getByText("Content here")).toBeInTheDocument();
  });

  it("renders iframe when content is a URL", async () => {
    mockGetGuidelinesDocument.mockResolvedValue({
      ...mockDraftGuideline,
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
  it("shows Unauthorized Access when user is null", () => {
    mockUser = null;
    render(<CreateGuidelinePage />);
    expect(screen.getByText("Unauthorized Access")).toBeInTheDocument();
  });

  it("renders Go Back button when unauthorized", () => {
    mockUser = null;
    render(<CreateGuidelinePage />);
    expect(screen.getByRole("button", { name: /Go Back/i })).toBeInTheDocument();
  });
});

describe("CreateGuidelinePage — form", () => {
  it("renders Create New Guideline heading", () => {
    render(<CreateGuidelinePage />);
    expect(screen.getByText("Create New Guideline")).toBeInTheDocument();
  });

  it("renders Cancel, Save as Draft, and Publish buttons", () => {
    render(<CreateGuidelinePage />);
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save as Draft/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Publish/i })).toBeInTheDocument();
  });

  it("renders Guideline Title input", () => {
    render(<CreateGuidelinePage />);
    expect(screen.getByLabelText(/Guideline Title/i)).toBeInTheDocument();
  });

  it("renders rich text editor for content", () => {
    render(<CreateGuidelinePage />);
    expect(screen.getByTestId("rich-text-editor")).toBeInTheDocument();
  });

  it("allows typing a title", () => {
    render(<CreateGuidelinePage />);
    const titleInput = screen.getByLabelText(/Guideline Title/i);
    fireEvent.change(titleInput, { target: { value: "My Guide" } });
    expect(titleInput).toHaveValue("My Guide");
  });

  it("navigates back on Cancel", () => {
    render(<CreateGuidelinePage />);
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(mockBack).toHaveBeenCalled();
  });
});

describe("CreateGuidelinePage — save as draft", () => {
  it("calls createGuidelinesDocument without publishGuidelinesDocument on Save as Draft", async () => {
    render(<CreateGuidelinePage />);
    fireEvent.change(screen.getByLabelText(/Guideline Title/i), {
      target: { value: "My Guide" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save as Draft/i }));
    await waitFor(() => {
      expect(mockCreateGuidelinesDocument).toHaveBeenCalled();
      expect(mockPublishGuidelinesDocument).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/dashboard/guidelines");
    });
  });
});
