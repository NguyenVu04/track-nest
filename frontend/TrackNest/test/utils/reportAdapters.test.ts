jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("@/services/mediaUpload", () => ({
  minioService: { uploadFile: jest.fn() },
}));
jest.mock("@/services/criminalReports", () => ({
  criminalReportsService: {
    getCrimeReports: jest.fn(),
    getCrimeReportById: jest.fn(),
    getMissingPersonReports: jest.fn(),
    getGuidelines: jest.fn(),
  },
}));

import {
  fetchReports,
  getReportById,
  fetchMissingPersons,
  fetchGuides,
  MOCK,
  MOCK_MISSING,
  MOCK_GUIDES,
} from "@/utils/reportAdapters";
import { criminalReportsService } from "@/services/criminalReports";

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

const MOCK_CRIME_REPORT = {
  id: "cr-1",
  title: "Theft at market",
  createdAt: "2024-06-01T08:00:00.000Z",
  latitude: 21.0278,
  longitude: 105.8342,
  severity: 4,
  content: "A handbag was stolen",
  numberOfVictims: 2,
  numberOfOffenders: 1,
  photos: ["https://cdn.example.com/photo.jpg"],
};

const MOCK_MISSING_PERSON = {
  id: "mp-1",
  fullName: "Nguyen Van A",
  content: "Missing since last Tuesday",
  date: "2024-05-28T00:00:00.000Z",
  createdAt: "2024-05-28T06:00:00.000Z",
  photo: "https://cdn.example.com/person.jpg",
};

const MOCK_GUIDELINE = {
  id: "g-1",
  title: "Safety Tips",
  content: "Stay safe out there",
  isPublic: true,
};

// ─── fetchReports ─────────────────────────────────────────────────────────────

describe("fetchReports", () => {
  it("returns adapted crime reports on success", async () => {
    (criminalReportsService.getCrimeReports as jest.Mock).mockResolvedValue({
      content: [MOCK_CRIME_REPORT],
      totalElements: 1,
    });

    const result = await fetchReports({ page: 1, perPage: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);

    const report = result.data[0];
    expect(report.id).toBe("cr-1");
    expect(report.title).toBe("Theft at market");
    expect(report.severity).toBe("High");
    expect(report.description).toBe("A handbag was stolen");
    expect(report.address).toBe("21.0278, 105.8342");
    expect(report.photos).toEqual(["https://cdn.example.com/photo.jpg"]);
  });

  it("calls getCrimeReports with zero-indexed page", async () => {
    (criminalReportsService.getCrimeReports as jest.Mock).mockResolvedValue({
      content: [],
      totalElements: 0,
    });

    await fetchReports({ page: 3, perPage: 5 });

    expect(criminalReportsService.getCrimeReports).toHaveBeenCalledWith({ page: 2, size: 5 });
  });

  it("uses default fallback description when content is empty", async () => {
    (criminalReportsService.getCrimeReports as jest.Mock).mockResolvedValue({
      content: [{ ...MOCK_CRIME_REPORT, content: "" }],
      totalElements: 1,
    });

    const result = await fetchReports();
    expect(result.data[0].description).toMatch(/Victims:/);
  });

  it("returns empty data on service failure", async () => {
    (criminalReportsService.getCrimeReports as jest.Mock).mockRejectedValue(new Error("Network"));

    const result = await fetchReports();
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });
});

// ─── getReportById ────────────────────────────────────────────────────────────

describe("getReportById", () => {
  it("returns the adapted report for a valid ID", async () => {
    (criminalReportsService.getCrimeReportById as jest.Mock).mockResolvedValue(MOCK_CRIME_REPORT);

    const report = await getReportById("cr-1");
    expect(report).toBeDefined();
    expect(report!.id).toBe("cr-1");
    expect(report!.severity).toBe("High");
    expect(report!.address).toBe("21.0278, 105.8342");
  });

  it("adapts severity values correctly", async () => {
    (criminalReportsService.getCrimeReportById as jest.Mock).mockResolvedValue({
      ...MOCK_CRIME_REPORT,
      severity: 2,
    });
    const report = await getReportById("cr-1");
    expect(report!.severity).toBe("Medium");
  });

  it("returns undefined when the service throws", async () => {
    (criminalReportsService.getCrimeReportById as jest.Mock).mockRejectedValue(new Error("Not found"));

    const report = await getReportById("nonexistent");
    expect(report).toBeUndefined();
  });
});

// ─── fetchMissingPersons ──────────────────────────────────────────────────────

describe("fetchMissingPersons", () => {
  it("returns adapted missing persons on success", async () => {
    (criminalReportsService.getMissingPersonReports as jest.Mock).mockResolvedValue({
      content: [MOCK_MISSING_PERSON],
      totalElements: 1,
    });

    const result = await fetchMissingPersons({ page: 1, perPage: 10 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe("Nguyen Van A");
    expect(result.data[0].severity).toBe("High");
    expect(result.data[0].photo).toBe("https://cdn.example.com/person.jpg");
  });

  it("uses createdAt when date field is falsy", async () => {
    (criminalReportsService.getMissingPersonReports as jest.Mock).mockResolvedValue({
      content: [{ ...MOCK_MISSING_PERSON, date: null }],
      totalElements: 1,
    });

    const result = await fetchMissingPersons();
    expect(result.data[0].lastSeen).toBeTruthy();
  });

  it("returns empty data on service failure", async () => {
    (criminalReportsService.getMissingPersonReports as jest.Mock).mockRejectedValue(new Error("err"));

    const result = await fetchMissingPersons();
    expect(result.data).toEqual([]);
  });
});

// ─── fetchGuides ──────────────────────────────────────────────────────────────

describe("fetchGuides", () => {
  it("marks a public guideline as 'Published'", async () => {
    (criminalReportsService.getGuidelines as jest.Mock).mockResolvedValue({
      content: [MOCK_GUIDELINE],
      totalElements: 1,
    });

    const result = await fetchGuides();
    expect(result.data[0].category).toBe("Published");
    expect(result.data[0].title).toBe("Safety Tips");
    expect(result.data[0].content).toBe("Stay safe out there");
  });

  it("marks a private guideline as 'Draft'", async () => {
    (criminalReportsService.getGuidelines as jest.Mock).mockResolvedValue({
      content: [{ ...MOCK_GUIDELINE, isPublic: false }],
      totalElements: 1,
    });

    const result = await fetchGuides();
    expect(result.data[0].category).toBe("Draft");
  });

  it("returns empty data on service failure", async () => {
    (criminalReportsService.getGuidelines as jest.Mock).mockRejectedValue(new Error("err"));

    const result = await fetchGuides();
    expect(result.data).toEqual([]);
  });
});

// ─── MOCK constants ───────────────────────────────────────────────────────────

describe("MOCK constants", () => {
  it("MOCK has at least one entry with required fields", () => {
    expect(MOCK.length).toBeGreaterThan(0);
    expect(MOCK[0]).toHaveProperty("id");
    expect(MOCK[0]).toHaveProperty("title");
    expect(MOCK[0]).toHaveProperty("severity");
  });

  it("MOCK_MISSING has at least one entry with required fields", () => {
    expect(MOCK_MISSING.length).toBeGreaterThan(0);
    expect(MOCK_MISSING[0]).toHaveProperty("name");
    expect(MOCK_MISSING[0]).toHaveProperty("age");
  });

  it("MOCK_GUIDES has at least one entry with required fields", () => {
    expect(MOCK_GUIDES.length).toBeGreaterThan(0);
    expect(MOCK_GUIDES[0]).toHaveProperty("title");
    expect(MOCK_GUIDES[0]).toHaveProperty("content");
  });
});
