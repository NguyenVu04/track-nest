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
  photos?: string[];
  createdAt: string;
  reporterId: string;
  isPublic: boolean;
}

export interface MissingPersonReport {
  id: string;
  title: string;
  fullName: string;
  personalId?: string;
  photo?: string;
  latitude?: number;
  longitude?: number;
  contactEmail?: string;
  contactPhone?: string;
  date: string;
  content: string;
  status: "PENDING" | "REJECTED" | "PUBLISHED";
  isPublic: boolean;
  createdAt: string;
  userId: string;
  reporterId: string;
}

export interface GuidelinesDocument {
  id: string;
  title: string;
  abstractText: string;
  content: string;
  createdAt: string;
  reporterId: string;
  isPublic: boolean;
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
  photos?: string[];
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

// Update Input Types
export interface UpdateMissingPersonReportInput {
  title?: string;
  fullName?: string;
  personalId?: string;
  contactEmail?: string;
  contactPhone?: string;
  date?: string;
  content?: string;
  photo?: string;
}

export interface UpdateGuidelinesDocumentInput {
  title?: string;
  abstractText?: string;
  content?: string;
  isPublic?: boolean;
}

export interface SubmitMissingPersonReportParams {
  userId: string;
  reporterId: string;
  title: string;
  fullName: string;
  personalId: string;
  photo?: string;
  contactEmail?: string;
  contactPhone: string;
  date: string;
  content: string;
}

export interface CrimeTrendPoint {
  date: string;
  count: number;
}

export interface HotspotArea {
  longitude: number;
  latitude: number;
  incidentCount: number;
  averageSeverity: number;
}

export interface CrimeAnalysisReportResponse {
  reportDate: string;
  totalCrimeReports: number;
  totalMissingPersonReports: number;
  crimesBySeverity: Record<number, number>;
  crimesByType: Record<string, number>;
  totalArrests: number;
  totalVictims: number;
  totalOffenders: number;
  crimeTrend: CrimeTrendPoint[];
  hotspots: HotspotArea[];
}

export interface DashboardSummaryResponse {
  crimeStats: {
    total: number;
    active: number;
    investigating: number;
    resolved: number;
  };
  missingPersonStats: {
    total: number;
    pending: number;
    published: number;
    rejected: number;
  };
  guidelineStats: {
    total: number;
    thisMonth: number;
  };
  reporterStats: {
    totalReporters: number;
  };
  crimeByType: Array<{ name: string; value: number }>;
  weeklyTrend: Array<{ date: string; dayName: string; crimes: number; missing: number }>;
  severityGroups: Array<{ name: string; value: number }>;
  statusGroups: Array<{ name: string; value: number }>;
}

export interface FileUploadResponse {
  filename: string;
  url: string;
  contentType: string;
  size: number;
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
    const [authMetadata, userId] = await Promise.all([
      getAuthMetadata(),
      getUserId(),
    ]);
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
    const response = await client.get(
      `/report-manager/crime-reports/${reportId}`,
    );
    return response.data;
  }

  async updateCrimeReport(
    reportId: string,
    data: UpdateCrimeReportInput,
  ): Promise<CrimeReport> {
    const client = await this.getMutationClient();
    const response = await client.put(
      `/report-manager/crime-reports/${reportId}`,
      data,
    );
    return response.data;
  }

  async publishCrimeReport(reportId: string): Promise<CrimeReport> {
    const client = await this.getMutationClient();
    const response = await client.post(
      `/report-manager/crime-reports/${reportId}/publish`,
    );
    return response.data;
  }

  async deleteCrimeReport(reportId: string): Promise<void> {
    const client = await this.getMutationClient();
    await client.delete(`/report-manager/crime-reports/${reportId}`);
  }

  async getCrimeReports(
    query: CrimeReportsQuery = {},
  ): Promise<PageResponse<CrimeReport>> {
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

  async getNearbyCrimeReports(
    query: NearbyCrimeReportsQuery,
  ): Promise<PageResponse<CrimeReport>> {
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

  async getCrimeHeatmap(
    longitude: number,
    latitude: number,
    radius: number = 5000,
    page: number = 0,
    size: number = 50,
  ): Promise<PageResponse<CrimeReport>> {
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

  async createMissingPersonReport(
    data: CreateMissingPersonReportInput,
  ): Promise<MissingPersonReport> {
    const client = await this.getMutationClient();
    const response = await client.post(
      "/report-manager/missing-person-reports",
      data,
    );
    return response.data;
  }

  async getMissingPersonReportById(
    reportId: string,
  ): Promise<MissingPersonReport> {
    const client = await this.getApiClient();
    const response = await client.get(
      `/report-manager/missing-person-reports/${reportId}`,
    );
    return response.data;
  }

  async updateMissingPersonReport(
    reportId: string,
    data: UpdateMissingPersonReportInput,
  ): Promise<MissingPersonReport> {
    const client = await this.getMutationClient();
    const response = await client.put(
      `/report-manager/missing-person-reports/${reportId}`,
      data,
    );
    return response.data;
  }

  async publishMissingPersonReport(
    reportId: string,
  ): Promise<MissingPersonReport> {
    const client = await this.getMutationClient();
    const response = await client.post(
      `/report-manager/missing-person-reports/${reportId}/publish`,
    );
    return response.data;
  }

  async rejectMissingPersonReport(
    reportId: string,
  ): Promise<MissingPersonReport> {
    const client = await this.getMutationClient();
    const response = await client.post(
      `/report-manager/missing-person-reports/${reportId}/reject`,
    );
    return response.data;
  }

  async deleteMissingPersonReport(reportId: string): Promise<void> {
    const client = await this.getMutationClient();
    await client.delete(`/report-manager/missing-person-reports/${reportId}`);
  }

  async getMissingPersonReports(
    page: number = 0,
    size: number = 20,
    isPublic?: boolean,
    status?: string,
  ): Promise<PageResponse<MissingPersonReport>> {
    const client = await this.getMutationClient();
    const response = await client.get(
      "/report-manager/missing-person-reports",
      {
        params: { isPublic, status, page, size },
      },
    );
    return response.data;
  }

  /** Submit a missing person report externally (no session required). */
  async submitMissingPersonReport(
    params: SubmitMissingPersonReportParams,
  ): Promise<MissingPersonReport> {
    const client = await this.getApiClient();
    const response = await client.post(
      "/missing-person-request-receiver/submit",
      null,
      { params },
    );
    return response.data;
  }

  // ==================== Guidelines ====================

  async getGuidelines(
    page: number = 0,
    size: number = 20,
    isPublic?: boolean,
  ): Promise<PageResponse<GuidelinesDocument>> {
    const client = await this.getApiClient();
    const response = await client.get("/report-manager/guidelines", {
      params: { isPublic, page, size },
    });
    return response.data;
  }

  async getGuidelinesById(documentId: string): Promise<GuidelinesDocument> {
    const client = await this.getApiClient();
    const response = await client.get(
      `/report-manager/guidelines/${documentId}`,
    );
    return response.data;
  }

  async createGuidelines(
    title: string,
    abstractText: string,
    content: string,
    isPublic: boolean = false,
  ): Promise<GuidelinesDocument> {
    const client = await this.getMutationClient();
    const response = await client.post("/report-manager/guidelines", {
      title,
      abstractText,
      content,
      isPublic,
    });
    return response.data;
  }

  async updateGuidelines(
    documentId: string,
    data: UpdateGuidelinesDocumentInput,
  ): Promise<GuidelinesDocument> {
    const client = await this.getMutationClient();
    const response = await client.put(
      `/report-manager/guidelines/${documentId}`,
      data,
    );
    return response.data;
  }

  async publishGuidelines(documentId: string): Promise<GuidelinesDocument> {
    const client = await this.getMutationClient();
    const response = await client.post(
      `/report-manager/guidelines/${documentId}/publish`,
    );
    return response.data;
  }

  async deleteGuidelines(documentId: string): Promise<void> {
    const client = await this.getMutationClient();
    await client.delete(`/report-manager/guidelines/${documentId}`);
  }

  // ==================== Report Viewer (public, no X-User-Id required) ====================

  async getPublicCrimeReports(
    page: number = 0,
    size: number = 10,
    isPublic: boolean = true,
  ): Promise<PageResponse<CrimeReport>> {
    const client = await this.getApiClient();
    const response = await client.get("/report-viewer/crime-reports", {
      params: { isPublic, page, size },
    });
    return response.data;
  }

  async getPublicCrimeReportById(reportId: string): Promise<CrimeReport> {
    const client = await this.getApiClient();
    const response = await client.get(
      `/report-viewer/crime-reports/${reportId}`,
    );
    return response.data;
  }

  async getPublicMissingPersonReports(
    page: number = 0,
    size: number = 10,
    isPublic: boolean = true,
  ): Promise<PageResponse<MissingPersonReport>> {
    const client = await this.getApiClient();
    const response = await client.get("/report-viewer/missing-person-reports", {
      params: { isPublic, page, size },
    });
    return response.data;
  }

  async getPublicMissingPersonReportById(
    reportId: string,
  ): Promise<MissingPersonReport> {
    const client = await this.getApiClient();
    const response = await client.get(
      `/report-viewer/missing-person-reports/${reportId}`,
    );
    return response.data;
  }

  async getPublicGuidelines(
    page: number = 0,
    size: number = 10,
    isPublic: boolean = true,
  ): Promise<PageResponse<GuidelinesDocument>> {
    const client = await this.getApiClient();
    const response = await client.get("/report-viewer/guidelines", {
      params: { isPublic, page, size },
    });
    return response.data;
  }

  async getPublicGuidelinesById(
    documentId: string,
  ): Promise<GuidelinesDocument> {
    const client = await this.getApiClient();
    const response = await client.get(
      `/report-viewer/guidelines/${documentId}`,
    );
    return response.data;
  }

  // ==================== Crime Analyzer ====================

  async getCrimeAnalysis(
    startDate: string,
    endDate: string,
  ): Promise<CrimeAnalysisReportResponse> {
    const client = await this.getApiClient();
    const response = await client.get("/criminal-analyzer/crime-analysis", {
      params: { startDate, endDate },
    });
    return response.data;
  }

  async getDashboardSummary(): Promise<DashboardSummaryResponse> {
    const client = await this.getApiClient();
    const response = await client.get("/criminal-analyzer/dashboard");
    return response.data;
  }

  // ==================== Admin (hard-delete regardless of ownership) ====================

  async adminDeleteMissingPersonReport(reportId: string): Promise<void> {
    const client = await this.getApiClient();
    await client.delete(`/report-admin/missing-person-reports/${reportId}`);
  }

  async adminDeleteCrimeReport(reportId: string): Promise<void> {
    const client = await this.getApiClient();
    await client.delete(`/report-admin/crime-reports/${reportId}`);
  }

  async adminDeleteGuidelines(documentId: string): Promise<void> {
    const client = await this.getApiClient();
    await client.delete(`/report-admin/guidelines/${documentId}`);
  }

  // ==================== File Management ====================

  async uploadFile(
    file: { uri: string; filename: string; type: string },
    bucket: string = "criminal-reports",
  ): Promise<FileUploadResponse> {
    const client = await this.getMutationClient();
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      name: file.filename,
      type: file.type,
    } as any);
    formData.append("bucket", bucket);
    const response = await client.post("/file/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  /**
   * Upload a file scoped to a document.
   * HTML files → {documentId}/index.html; others → {documentId}/{filename}.
   */
  async uploadDocumentFile(
    documentId: string,
    file: { uri: string; filename: string; type: string },
  ): Promise<FileUploadResponse> {
    const client = await this.getMutationClient();
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      name: file.filename,
      type: file.type,
    } as unknown as Blob);
    const response = await client.post(`/file/document/${documentId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  /** Delete all files in a document's folder ({documentId}/) */
  async deleteDocumentFolder(documentId: string): Promise<void> {
    const client = await this.getMutationClient();
    await client.delete(`/file/document/${documentId}`);
  }

  async deleteFile(bucket: string, filename: string): Promise<void> {
    const client = await this.getMutationClient();
    await client.delete(`/file/${bucket}/${filename}`);
  }

  async getFileUrl(bucket: string, filename: string): Promise<string> {
    const client = await this.getApiClient();
    const response = await client.get(`/file/${bucket}/${filename}`);
    return response.data;
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
    case "High":
      return 5;
    case "Medium":
      return 3;
    case "Low":
      return 1;
    default:
      return 3;
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
  const uploadedUrls: string[] = [];

  if (data.images && data.images.length > 0) {
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
  }

  const today = new Date().toISOString().split("T")[0];
  const reportData: CreateCrimeReportInput = {
    title: data.title,
    content: data.description,
    severity: severityToNumber(data.severity),
    date: today,
    latitude: data.latitude,
    longitude: data.longitude,
    numberOfVictims: 1,
    numberOfOffenders: 1,
    arrested: false,
    photos: uploadedUrls.length > 0 ? uploadedUrls : undefined,
  };

  return criminalReportsService.createCrimeReport(reportData);
}
