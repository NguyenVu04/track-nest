import { getCriminalUrl } from "@/utils";
import { getAuthMetadata, getUserId } from "@/utils/auth";
import axios from "axios";
import { minioService } from "./mediaUpload";

// Crime Report Types (matching backend Java models)
export interface CrimeReport {
  id: string;
  title: string;
  content: string;
  severity: number; // 1-5 scale
  date: string;
  latitude: number;
  longitude: number;
  numberOfVictims: number;
  numberOfOffenders: number;
  arrested: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MissingPersonReport {
  id: string;
  title: string;
  fullName: string;
  personalId?: string;
  photo?: string;
  contactEmail?: string;
  contactPhone?: string;
  date: string;
  content: string;
  lastSeenLatitude?: number;
  lastSeenLongitude?: number;
  status?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GuidelinesDocument {
  id: string;
  title: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// Create Report Input Types
export interface CreateCrimeReportInput {
  title: string;
  content: string;
  severity: number;
  date: string;
  latitude: number;
  longitude: number;
  numberOfVictims?: number;
  numberOfOffenders?: number;
  arrested?: boolean;
}

export interface UpdateCrimeReportInput {
  title?: string;
  content?: string;
  severity?: number;
  date?: string;
  numberOfVictims?: number;
  numberOfOffenders?: number;
  arrested?: boolean;
}

export interface CreateMissingPersonReportInput {
  title: string;
  fullName: string;
  personalId?: string;
  contactEmail?: string;
  contactPhone?: string;
  date: string;
  content: string;
  photo?: string;
}

// Query Types
export interface CrimeReportsQuery {
  page?: number;
  size?: number;
  isPublic?: boolean;
  minSeverity?: number;
}

export interface NearbyCrimeReportsQuery {
  longitude: number;
  latitude: number;
  radius?: number; // in meters
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// Criminal Reports Service Client
class CriminalReportsService {
  private baseUrl: string = "";

  private async getApiClient() {
    if (!this.baseUrl) {
      this.baseUrl = await getCriminalUrl();
    }

    const authMetadata = await getAuthMetadata();
    return axios.create({
      baseURL: this.baseUrl,
      headers: authMetadata,
    });
  }

  /** Returns axios headers including Authorization + X-User-Id for mutating endpoints. */
  private async getMutationHeaders(): Promise<Record<string, string>> {
    const [authMetadata, userId] = await Promise.all([getAuthMetadata(), getUserId()]);
    return {
      ...authMetadata,
      "X-User-Id": userId,
    };
  }

  private async getMutationClient() {
    if (!this.baseUrl) {
      this.baseUrl = await getCriminalUrl();
    }

    const headers = await this.getMutationHeaders();
    return axios.create({
      baseURL: this.baseUrl,
      headers,
    });
  }

  // ==================== Crime Reports ====================

  async createCrimeReport(data: CreateCrimeReportInput): Promise<CrimeReport> {
    const client = await this.getMutationClient();
    const response = await client.post("/report-manager/crime-reports", data);
    return response.data;
  }

  async getCrimeReportById(reportId: string): Promise<CrimeReport> {
    const client = await this.getMutationClient(); // GET but requires X-User-Id per docs
    const response = await client.get(`/report-manager/crime-reports/${reportId}`);
    return response.data;
  }

  async updateCrimeReport(reportId: string, data: UpdateCrimeReportInput): Promise<CrimeReport> {
    const client = await this.getMutationClient();
    const response = await client.put(`/report-manager/crime-reports/${reportId}`, data);
    return response.data;
  }

  async publishCrimeReport(reportId: string): Promise<CrimeReport> {
    const client = await this.getMutationClient();
    const response = await client.post(`/report-manager/crime-reports/${reportId}/publish`);
    return response.data;
  }

  async deleteCrimeReport(reportId: string): Promise<void> {
    const client = await this.getMutationClient();
    await client.delete(`/report-manager/crime-reports/${reportId}`);
  }

  async getCrimeReports(query: CrimeReportsQuery = {}): Promise<PageResponse<CrimeReport>> {
    const client = await this.getApiClient();
    const response = await client.get("/report-manager/crime-reports", {
      params: {
        isPublic: query.isPublic,
        minSeverity: query.minSeverity,
        page: query.page ?? 0,
        size: query.size ?? 20,
      },
    });
    return response.data;
  }

  async getNearbyCrimeReports(query: NearbyCrimeReportsQuery): Promise<PageResponse<CrimeReport>> {
    const client = await this.getApiClient();
    const response = await client.get("/report-manager/crime-reports/nearby", {
      params: {
        longitude: query.longitude,
        latitude: query.latitude,
        radius: query.radius ?? 5000,
        page: query.page ?? 0,
        size: query.size ?? 20,
      },
    });
    return response.data;
  }

  async getCrimeHeatmap(longitude: number, latitude: number, radius: number = 5000, page: number = 0, size: number = 50): Promise<PageResponse<CrimeReport>> {
    const client = await this.getApiClient();
    const response = await client.get("/crime-locator/heatmap", {
      params: { longitude, latitude, radius, page, size },
    });
    return response.data;
  }

  async isHighRiskArea(longitude: number, latitude: number): Promise<boolean> {
    const client = await this.getApiClient();
    const response = await client.get("/crime-locator/high-risk-check", {
      params: { longitude, latitude },
    });
    return response.data;
  }

  // ==================== Missing Person Reports ====================

  async createMissingPersonReport(data: CreateMissingPersonReportInput): Promise<MissingPersonReport> {
    const client = await this.getMutationClient();
    const response = await client.post("/report-manager/missing-person-reports", data);
    return response.data;
  }

  async getMissingPersonReportById(reportId: string): Promise<MissingPersonReport> {
    const client = await this.getApiClient();
    const response = await client.get(`/report-manager/missing-person-reports/${reportId}`);
    return response.data;
  }

  async publishMissingPersonReport(reportId: string): Promise<void> {
    const client = await this.getMutationClient();
    await client.post(`/report-manager/missing-person-reports/${reportId}/publish`);
  }

  async deleteMissingPersonReport(reportId: string): Promise<void> {
    const client = await this.getMutationClient();
    await client.delete(`/report-manager/missing-person-reports/${reportId}`);
  }

  async getMissingPersonReports(page: number = 0, size: number = 20, isPublic?: boolean, status?: string): Promise<PageResponse<MissingPersonReport>> {
    const client = await this.getApiClient();
    const response = await client.get("/report-manager/missing-person-reports", {
      params: { isPublic, status, page, size },
    });
    return response.data;
  }

  // ==================== Guidelines ====================

  async getGuidelines(page: number = 0, size: number = 20, isPublic?: boolean): Promise<PageResponse<GuidelinesDocument>> {
    const client = await this.getApiClient();
    const response = await client.get("/report-manager/guidelines", {
      params: { isPublic, page, size },
    });
    return response.data;
  }

  async getGuidelinesById(documentId: string): Promise<GuidelinesDocument> {
    const client = await this.getApiClient();
    const response = await client.get(`/report-manager/guidelines/${documentId}`);
    return response.data;
  }

  async createGuidelines(title: string, content: string): Promise<GuidelinesDocument> {
    const client = await this.getMutationClient();
    const response = await client.post("/report-manager/guidelines", { title, content });
    return response.data;
  }

  async publishGuidelines(documentId: string): Promise<void> {
    const client = await this.getMutationClient();
    await client.post(`/report-manager/guidelines/${documentId}/publish`);
  }

  async deleteGuidelines(documentId: string): Promise<void> {
    const client = await this.getMutationClient();
    await client.delete(`/report-manager/guidelines/${documentId}`);
  }
}

// Export singleton instance
export const criminalReportsService = new CriminalReportsService();
export default criminalReportsService;

// Helper functions for UI

export function getSeverityLabel(severity: number): string {
  if (severity >= 4) return "High";
  if (severity >= 2) return "Medium";
  return "Low";
}

export function getSeverityColor(severity: number): string {
  if (severity >= 4) return "#e74c3c";
  if (severity >= 2) return "#f39c12";
  return "#27ae60";
}

export function severityToNumber(severity: "Low" | "Medium" | "High"): number {
  switch (severity) {
    case "High": return 5;
    case "Medium": return 3;
    case "Low": return 1;
    default: return 3;
  }
}

/**
 * Create a crime report from UI form.
 * Uploads images to MinIO first, then creates the report.
 */
export async function createCrimeReport(data: {
  title: string;
  description: string;
  severity: "Low" | "Medium" | "High";
  latitude: number;
  longitude: number;
  images: string[];
}): Promise<CrimeReport> {
  let contentWithImages = data.description;

  if (data.images && data.images.length > 0) {
    const uploadedUrls: string[] = [];

    for (const imageUri of data.images) {
      try {
        const filename = `crime_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const result = await minioService.uploadFile({
          uri: imageUri,
          filename,
          type: "image/jpeg",
        });
        uploadedUrls.push(result.url);
      } catch (error) {
        console.warn("Failed to upload image:", error);
      }
    }

    if (uploadedUrls.length > 0) {
      contentWithImages = `${data.description}\n\nImages: ${uploadedUrls.join(", ")}`;
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const reportData: CreateCrimeReportInput = {
    title: data.title,
    content: contentWithImages,
    severity: severityToNumber(data.severity),
    date: today,
    latitude: data.latitude,
    longitude: data.longitude,
    numberOfVictims: 1,
    numberOfOffenders: 1,
    arrested: false,
  };

  return criminalReportsService.createCrimeReport(reportData);
}
