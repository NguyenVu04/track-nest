import { getBaseUrl } from "@/utils";
import { getAuthMetadata } from "@/utils/auth";
import axios from "axios";
import { minioService } from "./mediaUpload";

// Crime Report Types (matching backend Java models)
export interface Location {
  latitude: number;
  longitude: number;
}

export interface CrimeReport {
  id: string;
  title: string;
  content: string; // URL to detailed content
  severity: number; // 1-5 scale
  latitude: number;
  longitude: number;
  numberOfVictims: number;
  numberOfOffenders: number;
  arrested: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MissingPersonReport {
  id: string;
  title: string;
  fullName: string;
  personalId?: string;
  photo?: string; // URL to photo
  contactEmail?: string;
  contactPhone?: string;
  date: string;
  content: string; // URL to detailed content
  lastSeenLatitude?: number;
  lastSeenLongitude?: number;
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
  latitude: number;
  longitude: number;
  numberOfVictims?: number;
  numberOfOffenders?: number;
}

export interface CreateMissingPersonReportInput {
  title: string;
  fullName: string;
  personalId?: string;
  contactEmail?: string;
  contactPhone?: string;
  date: string;
  content: string;
  lastSeenLatitude?: number;
  lastSeenLongitude?: number;
  photo?: string; // URL from MinIO upload
}

// Query Types
export interface CrimeReportsQuery {
  page?: number;
  size?: number;
  title?: string;
  severity?: number;
}

export interface NearbyCrimeReportsQuery {
  lat: number;
  lng: number;
  radius?: number; // in meters
  page?: number;
  size?: number;
}

// Criminal Reports Service Client
class CriminalReportsService {
  private baseUrl: string = "";

  private async getApiClient() {
    if (!this.baseUrl) {
      this.baseUrl = await getBaseUrl();
    }
    
    const authMetadata = await getAuthMetadata();
    return axios.create({
      baseURL: this.baseUrl,
      headers: authMetadata,
    });
  }

  // ==================== Crime Reports ====================

  /**
   * Create a new crime report
   */
  async createCrimeReport(data: CreateCrimeReportInput): Promise<CrimeReport> {
    const client = await this.getApiClient();
    const response = await client.post("/report-manager/crime-reports", data);
    return response.data;
  }

  /**
   * Get crime report by ID
   */
  async getCrimeReportById(reportId: string): Promise<CrimeReport> {
    const client = await this.getApiClient();
    const response = await client.get(`/report-manager/crime-reports/${reportId}`);
    return response.data;
  }

  /**
   * Publish a crime report (make it visible to public)
   */
  async publishCrimeReport(reportId: string): Promise<void> {
    const client = await this.getApiClient();
    await client.post(`/report-manager/crime-reports/${reportId}/publish`);
  }

  /**
   * Delete a crime report
   */
  async deleteCrimeReport(reportId: string): Promise<void> {
    const client = await this.getApiClient();
    await client.delete(`/report-manager/crime-reports/${reportId}`);
  }

  /**
   * List crime reports with filters and pagination
   */
  async getCrimeReports(query: CrimeReportsQuery = {}): Promise<{
    content: CrimeReport[];
    totalElements: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
  }> {
    const client = await this.getApiClient();
    const response = await client.get("/report-manager/crime-reports", {
      params: {
        page: query.page || 0,
        size: query.size || 20,
        title: query.title,
        severity: query.severity,
      },
    });
    return response.data;
  }

  /**
   * Get crime reports near a location
   */
  async getNearbyCrimeReports(query: NearbyCrimeReportsQuery): Promise<{
    content: CrimeReport[];
    totalElements: number;
  }> {
    const client = await this.getApiClient();
    const response = await client.get("/report-manager/crime-reports/nearby", {
      params: {
        lat: query.lat,
        lng: query.lng,
        radius: query.radius || 5000, // 5km default
        page: query.page || 0,
        size: query.size || 20,
      },
    });
    return response.data;
  }

  // ==================== Missing Person Reports ====================

  /**
   * Create a new missing person report
   */
  async createMissingPersonReport(data: CreateMissingPersonReportInput): Promise<MissingPersonReport> {
    const client = await this.getApiClient();
    const response = await client.post("/report-manager/missing-person-reports", data);
    return response.data;
  }

  /**
   * Get missing person report by ID
   */
  async getMissingPersonReportById(reportId: string): Promise<MissingPersonReport> {
    const client = await this.getApiClient();
    const response = await client.get(`/report-manager/missing-person-reports/${reportId}`);
    return response.data;
  }

  /**
   * Publish a missing person report
   */
  async publishMissingPersonReport(reportId: string): Promise<void> {
    const client = await this.getApiClient();
    await client.post(`/report-manager/missing-person-reports/${reportId}/publish`);
  }

  /**
   * Delete a missing person report
   */
  async deleteMissingPersonReport(reportId: string): Promise<void> {
    const client = await this.getApiClient();
    await client.delete(`/report-manager/missing-person-reports/${reportId}`);
  }

  /**
   * List all missing person reports with pagination
   */
  async getMissingPersonReports(page: number = 0, size: number = 20): Promise<{
    content: MissingPersonReport[];
    totalElements: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
  }> {
    const client = await this.getApiClient();
    const response = await client.get("/report-manager/missing-person-reports", {
      params: { page, size },
    });
    return response.data;
  }

  // ==================== Guidelines ====================

  /**
   * List guidelines documents
   */
  async getGuidelines(page: number = 0, size: number = 20): Promise<{
    content: GuidelinesDocument[];
    totalElements: number;
  }> {
    const client = await this.getApiClient();
    const response = await client.get("/report-manager/guidelines", {
      params: { page, size },
    });
    return response.data;
  }

  /**
   * Get guidelines document by ID
   */
  async getGuidelinesById(documentId: string): Promise<GuidelinesDocument> {
    const client = await this.getApiClient();
    const response = await client.get(`/report-manager/guidelines/${documentId}`);
    return response.data;
  }

  /**
   * Create a new guidelines document
   */
  async createGuidelines(title: string, content: string): Promise<GuidelinesDocument> {
    const client = await this.getApiClient();
    const response = await client.post("/report-manager/guidelines", {
      title,
      content,
    });
    return response.data;
  }

  /**
   * Publish guidelines document
   */
  async publishGuidelines(documentId: string): Promise<void> {
    const client = await this.getApiClient();
    await client.post(`/report-manager/guidelines/${documentId}/publish`);
  }

  /**
   * Delete guidelines document
   */
  async deleteGuidelines(documentId: string): Promise<void> {
    const client = await this.getApiClient();
    await client.delete(`/report-manager/guidelines/${documentId}`);
  }
}

// Export singleton instance
export const criminalReportsService = new CriminalReportsService();
export default criminalReportsService;

// Helper functions for UI

/**
 * Convert backend severity (1-5) to UI display format
 */
export function getSeverityLabel(severity: number): string {
  if (severity >= 4) return "High";
  if (severity >= 2) return "Medium";
  return "Low";
}

/**
 * Get severity color for UI
 */
export function getSeverityColor(severity: number): string {
  if (severity >= 4) return "#e74c3c"; // danger
  if (severity >= 2) return "#f39c12"; // warn
  return "#27ae60"; // success
}

/**
 * Convert UI severity string to number (1-5)
 */
export function severityToNumber(severity: "Low" | "Medium" | "High"): number {
  switch (severity) {
    case "High": return 5;
    case "Medium": return 3;
    case "Low": return 1;
    default: return 3;
  }
}

/**
 * Create a crime report from UI form
 * Handles image uploads to MinIO first, then creates the report
 */
export async function createCrimeReport(data: {
  title: string;
  description: string;
  address: string;
  severity: "Low" | "Medium" | "High";
  latitude: number;
  longitude: number;
  images: string[];
}): Promise<CrimeReport> {
  // Upload images first if any
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
    
    // Append image URLs to content
    if (uploadedUrls.length > 0) {
      contentWithImages = `${data.description}\n\nImages: ${uploadedUrls.join(", ")}`;
    }
  }
  
  // Create the report
  const reportData: CreateCrimeReportInput = {
    title: data.title,
    content: contentWithImages,
    severity: severityToNumber(data.severity),
    latitude: data.latitude,
    longitude: data.longitude,
    numberOfVictims: 1,
    numberOfOffenders: 1,
  };
  
  const createdReport = await criminalReportsService.createCrimeReport(reportData);
  
  // Optionally publish immediately (depends on requirements)
  // await criminalReportsService.publishCrimeReport(createdReport.id);
  
  return createdReport;
}