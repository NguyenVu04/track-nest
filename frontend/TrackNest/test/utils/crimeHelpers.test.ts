jest.mock("@/services/mediaUpload", () => ({
  minioService: { uploadFile: jest.fn() },
}));
jest.mock("@/services/criminalReports", () => ({
  criminalReportsService: { createCrimeReport: jest.fn() },
}));

import {
  getSeverityLabel,
  getSeverityColor,
  severityToNumber,
  createCrimeReport,
} from "@/utils/crimeHelpers";
import { minioService } from "@/services/mediaUpload";
import { criminalReportsService } from "@/services/criminalReports";

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("getSeverityLabel", () => {
  it("returns 'High' for severity >= 4", () => {
    expect(getSeverityLabel(4)).toBe("High");
    expect(getSeverityLabel(5)).toBe("High");
    expect(getSeverityLabel(100)).toBe("High");
  });

  it("returns 'Medium' for severity 2–3", () => {
    expect(getSeverityLabel(2)).toBe("Medium");
    expect(getSeverityLabel(3)).toBe("Medium");
  });

  it("returns 'Low' for severity < 2", () => {
    expect(getSeverityLabel(1)).toBe("Low");
    expect(getSeverityLabel(0)).toBe("Low");
    expect(getSeverityLabel(-5)).toBe("Low");
  });
});

describe("getSeverityColor", () => {
  it("returns red for severity >= 4", () => {
    expect(getSeverityColor(4)).toBe("#e74c3c");
    expect(getSeverityColor(5)).toBe("#e74c3c");
  });

  it("returns orange for severity 2–3", () => {
    expect(getSeverityColor(2)).toBe("#f39c12");
    expect(getSeverityColor(3)).toBe("#f39c12");
  });

  it("returns green for severity < 2", () => {
    expect(getSeverityColor(0)).toBe("#27ae60");
    expect(getSeverityColor(1)).toBe("#27ae60");
  });
});

describe("severityToNumber", () => {
  it("maps 'High' to 5", () => {
    expect(severityToNumber("High")).toBe(5);
  });

  it("maps 'Medium' to 3", () => {
    expect(severityToNumber("Medium")).toBe(3);
  });

  it("maps 'Low' to 1", () => {
    expect(severityToNumber("Low")).toBe(1);
  });
});

describe("createCrimeReport", () => {
  const baseInput = {
    title: "Test theft",
    description: "A bike was stolen",
    severity: "High" as const,
    latitude: 10.123,
    longitude: 20.456,
    images: [],
  };

  it("creates a report with no images and no upload calls", async () => {
    const mockReport = { id: "r1", title: "Test theft" };
    (criminalReportsService.createCrimeReport as jest.Mock).mockResolvedValue(mockReport);

    const result = await createCrimeReport(baseInput);

    expect(minioService.uploadFile).not.toHaveBeenCalled();
    expect(criminalReportsService.createCrimeReport).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Test theft",
        content: "A bike was stolen",
        severity: 5,
        latitude: 10.123,
        longitude: 20.456,
        photos: undefined,
      }),
    );
    expect(result).toEqual(mockReport);
  });

  it("uploads images and includes their URLs in the report", async () => {
    const mockReport = { id: "r2" };
    (minioService.uploadFile as jest.Mock).mockResolvedValue({ url: "https://cdn.example.com/img.jpg" });
    (criminalReportsService.createCrimeReport as jest.Mock).mockResolvedValue(mockReport);

    await createCrimeReport({ ...baseInput, severity: "Medium", images: ["file://img.jpg"] });

    expect(minioService.uploadFile).toHaveBeenCalledTimes(1);
    expect(criminalReportsService.createCrimeReport).toHaveBeenCalledWith(
      expect.objectContaining({ photos: ["https://cdn.example.com/img.jpg"], severity: 3 }),
    );
  });

  it("skips failed image uploads and still creates the report", async () => {
    (minioService.uploadFile as jest.Mock).mockRejectedValue(new Error("upload failed"));
    const mockReport = { id: "r3" };
    (criminalReportsService.createCrimeReport as jest.Mock).mockResolvedValue(mockReport);

    const result = await createCrimeReport({
      ...baseInput,
      severity: "Low",
      images: ["file://bad.jpg"],
    });

    expect(criminalReportsService.createCrimeReport).toHaveBeenCalledWith(
      expect.objectContaining({ photos: undefined }),
    );
    expect(result).toEqual(mockReport);
  });

  it("uploads multiple images successfully", async () => {
    (minioService.uploadFile as jest.Mock)
      .mockResolvedValueOnce({ url: "https://cdn.example.com/a.jpg" })
      .mockResolvedValueOnce({ url: "https://cdn.example.com/b.jpg" });
    (criminalReportsService.createCrimeReport as jest.Mock).mockResolvedValue({ id: "r4" });

    await createCrimeReport({
      ...baseInput,
      images: ["file://a.jpg", "file://b.jpg"],
    });

    expect(minioService.uploadFile).toHaveBeenCalledTimes(2);
    expect(criminalReportsService.createCrimeReport).toHaveBeenCalledWith(
      expect.objectContaining({
        photos: ["https://cdn.example.com/a.jpg", "https://cdn.example.com/b.jpg"],
      }),
    );
  });

  it("sets today's date on the report", async () => {
    (criminalReportsService.createCrimeReport as jest.Mock).mockResolvedValue({});
    await createCrimeReport(baseInput);

    const call = (criminalReportsService.createCrimeReport as jest.Mock).mock.calls[0][0];
    expect(call.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
