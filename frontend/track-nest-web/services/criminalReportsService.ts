import axios from "axios";
import { authService } from "./authService";
import type { CrimeSeverity } from "@/types";

const API_URL =
  process.env.NEXT_PUBLIC_CRIMINAL_REPORTS_API_URL ||
  "http://localhost:8800/criminal-reports";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    try {
      await authService.refreshToken();
    } catch {
      // Keep fallback behavior for unauthenticated/public requests.
    }

    const token =
      authService.getAccessToken() || localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const userId = authService.getUserId();
    if (userId) {
      config.headers["X-User-Id"] = userId;
    }
  }
  return config;
});

export interface SubmitMissingPersonReportRequest {
  title: string;
  fullName: string;
  personalId: string;
  photo?: File;
  contactEmail: string;
  contactPhone: string;
  date: string;
  content: string;
  latitude: number;
  longitude: number;
}

export interface CreateMissingPersonReportRequest {
  title: string;
  fullName: string;
  personalId: string;
  photo?: string;
  date: string;
  content: string;
  latitude?: number;
  longitude?: number;
  contactEmail?: string;
  contactPhone: string;
}

export interface UpdateMissingPersonReportRequest {
  title?: string;
  fullName?: string;
  personalId?: string;
  photo?: string;
  date?: string;
  content?: string;
  latitude?: number;
  longitude?: number;
  contactEmail?: string;
  contactPhone: string;
}

export interface MissingPersonReportResponse {
  id: string;
  title: string;
  fullName: string;
  personalId: string;
  photo: string;
  date: string;
  content: string;
  contentDocId: string;
  latitude?: number;
  longitude?: number;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  userId: string;
  status: "PENDING" | "REJECTED" | "PUBLISHED";
  reporterId: string;
  isPublic: boolean;
}

export interface SubmitCrimeReportRequest {
  title: string;
  content: string;
  severity: CrimeSeverity;
  date: string;
  longitude: number;
  latitude: number;
  numberOfVictims: number;
  numberOfOffenders: number;
  arrested: boolean;
  photos?: File[];
}

export interface CreateCrimeReportRequest {
  title: string;
  content: string;
  severity: CrimeSeverity;
  date: string;
  longitude: number;
  latitude: number;
  numberOfVictims: number;
  numberOfOffenders: number;
  arrested: boolean;
  photos?: string[];
}

export interface UpdateCrimeReportRequest {
  title: string;
  content?: string;
  severity: number;
  date: string;
  numberOfVictims?: number;
  numberOfOffenders?: number;
  arrested?: boolean;
  photos?: string[];
}

export interface CrimeReportResponse {
  id: string;
  title: string;
  content: string;
  contentDocId: string;
  severity: CrimeSeverity;
  date: string;
  longitude: number;
  latitude: number;
  numberOfVictims: number;
  numberOfOffenders: number;
  arrested: boolean;
  photos?: string[];
  createdAt: string;
  updatedAt: string;
  reporterId: string;
  isPublic: boolean;
}

export interface CreateGuidelinesDocumentRequest {
  title: string;
  abstractText: string;
  content: string;
  isPublic: boolean;
}

export interface UpdateGuidelinesDocumentRequest {
  title?: string;
  abstractText?: string;
  content?: string;
  isPublic?: boolean;
}

export interface FileUploadResponse {
  filename: string;
  url: string;
  contentType: string;
  size: number;
  publicUrl: string;
  objectName: string;
}

export interface GuidelinesDocumentResponse {
  id: string;
  title: string;
  abstractText: string;
  content: string;
  contentDocId: string;
  createdAt: string;
  reporterId: string;
  isPublic: boolean;
}

export interface ChatbotSessionResponse {
  sessionId: string;
  createdAtMs: number;
}

export interface ChatbotMessageResponse {
  response: string;
  createdAt: number;
}

export interface ChatbotSessionMessage {
  role: "USER" | "MODEL";
  content: string;
  createdAtMs: number;
}

export interface ChatbotSession {
  documentId: string;
  messages: ChatbotSessionMessage[];
  messageLeft: number;
  createdAtMs: number;
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

export interface DashboardNameValue {
  name: string;
  value: number;
}

export interface DashboardDailyTrend {
  date: string;
  dayName: string;
  crimes: number;
  missing: number;
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
  crimeByType: DashboardNameValue[];
  weeklyTrend: DashboardDailyTrend[];
  severityGroups: DashboardNameValue[];
  statusGroups: DashboardNameValue[];
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

export const criminalReportsService = {
  createMissingPersonReport: async (
    data: CreateMissingPersonReportRequest,
  ): Promise<MissingPersonReportResponse> => {
    const response = await api.post<MissingPersonReportResponse>(
      "/report-manager/missing-person-reports",
      data,
    );
    return response.data;
  },

  getMissingPersonReport: async (
    reportId: string,
  ): Promise<MissingPersonReportResponse> => {
    const response = await api.get<MissingPersonReportResponse>(
      `/report-manager/missing-person-reports/${reportId}`,
    );
    return response.data;
  },

  updateMissingPersonReport: async (
    reportId: string,
    data: UpdateMissingPersonReportRequest,
  ): Promise<MissingPersonReportResponse> => {
    const response = await api.put<MissingPersonReportResponse>(
      `/report-manager/missing-person-reports/${reportId}`,
      data,
    );
    return response.data;
  },

  deleteMissingPersonReport: async (reportId: string): Promise<void> => {
    await api.delete(`/report-manager/missing-person-reports/${reportId}`);
  },

  publishMissingPersonReport: async (
    reportId: string,
  ): Promise<MissingPersonReportResponse> => {
    const response = await api.post<MissingPersonReportResponse>(
      `/report-manager/missing-person-reports/${reportId}/publish`,
    );
    return response.data;
  },

  rejectMissingPersonReport: async (
    reportId: string,
  ): Promise<MissingPersonReportResponse> => {
    const response = await api.post<MissingPersonReportResponse>(
      `/report-manager/missing-person-reports/${reportId}/reject`,
    );
    return response.data;
  },

  listMissingPersonReports: async (params?: {
    reporterId?: string;
    status?: string;
    isPublic?: boolean;
    page?: number;
    size?: number;
  }): Promise<PageResponse<MissingPersonReportResponse>> => {
    const response = await api.get<PageResponse<MissingPersonReportResponse>>(
      "/report-manager/missing-person-reports",
      { params },
    );
    return response.data;
  },

  submitCrimeReport: async (
    data: SubmitCrimeReportRequest,
  ): Promise<CrimeReportResponse> => {
    const formData = new FormData();
    formData.append("title", data.title);
    if (data.content) formData.append("content", data.content);
    formData.append("severity", data.severity.toString());
    formData.append("date", data.date);
    formData.append("longitude", data.longitude.toString());
    formData.append("latitude", data.latitude.toString());
    formData.append("numberOfVictims", data.numberOfVictims.toString());
    formData.append("numberOfOffenders", data.numberOfOffenders.toString());
    formData.append("arrested", data.arrested.toString());
    if (data.photos) {
      data.photos.forEach((photo) => formData.append("photos", photo));
    }
    const response = await api.post<CrimeReportResponse>(
      "/report-manager/crime-reports",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  createCrimeReport: async (
    data: CreateCrimeReportRequest,
  ): Promise<CrimeReportResponse> => {
    const response = await api.post<CrimeReportResponse>(
      "/report-manager/crime-reports",
      data,
    );
    return response.data;
  },

  getCrimeReport: async (reportId: string): Promise<CrimeReportResponse> => {
    const response = await api.get<CrimeReportResponse>(
      `/report-manager/crime-reports/${reportId}`,
    );
    return response.data;
  },

  publishCrimeReport: async (
    reportId: string,
  ): Promise<CrimeReportResponse> => {
    const response = await api.post<CrimeReportResponse>(
      `/report-manager/crime-reports/${reportId}/publish`,
    );
    return response.data;
  },

  updateCrimeReport: async (
    reportId: string,
    data: UpdateCrimeReportRequest,
  ): Promise<CrimeReportResponse> => {
    const response = await api.put<CrimeReportResponse>(
      `/report-manager/crime-reports/${reportId}`,
      data,
    );
    return response.data;
  },

  deleteCrimeReport: async (reportId: string): Promise<void> => {
    await api.delete(`/report-manager/crime-reports/${reportId}`);
  },

  listCrimeReports: async (params?: {
    reporterId?: string;
    minSeverity?: number;
    maxSeverity?: number;
    title?: string;
    isPublic?: boolean;
    page?: number;
    size?: number;
  }): Promise<PageResponse<CrimeReportResponse>> => {
    const response = await api.get<PageResponse<CrimeReportResponse>>(
      "/report-manager/crime-reports",
      { params },
    );
    return response.data;
  },

  listCrimeReportsNearby: async (
    longitude: number,
    latitude: number,
    radius?: number,
    page?: number,
    size?: number,
  ): Promise<PageResponse<CrimeReportResponse>> => {
    const response = await api.get<PageResponse<CrimeReportResponse>>(
      "/report-manager/crime-reports/nearby",
      {
        params: { longitude, latitude, radius: radius || 5000, page, size },
      },
    );
    return response.data;
  },

  createGuidelinesDocument: async (
    data: CreateGuidelinesDocumentRequest,
  ): Promise<GuidelinesDocumentResponse> => {
    const response = await api.post<GuidelinesDocumentResponse>(
      "/report-manager/guidelines",
      data,
    );
    return response.data;
  },

  getGuidelinesDocument: async (
    documentId: string,
  ): Promise<GuidelinesDocumentResponse> => {
    const response = await api.get<GuidelinesDocumentResponse>(
      `/report-manager/guidelines/${documentId}`,
    );
    return response.data;
  },

  publishGuidelinesDocument: async (
    documentId: string,
  ): Promise<GuidelinesDocumentResponse> => {
    const response = await api.post<GuidelinesDocumentResponse>(
      `/report-manager/guidelines/${documentId}/publish`,
    );
    return response.data;
  },

  updateGuidelinesDocument: async (
    documentId: string,
    data: UpdateGuidelinesDocumentRequest,
  ): Promise<GuidelinesDocumentResponse> => {
    const response = await api.put<GuidelinesDocumentResponse>(
      `/report-manager/guidelines/${documentId}`,
      data,
    );
    return response.data;
  },

  deleteGuidelinesDocument: async (documentId: string): Promise<void> => {
    await api.delete(`/report-manager/guidelines/${documentId}`);
  },

  listGuidelinesDocuments: async (params?: {
    reporterId?: string;
    isPublic?: boolean;
    title?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<GuidelinesDocumentResponse>> => {
    const response = await api.get<PageResponse<GuidelinesDocumentResponse>>(
      "/report-manager/guidelines",
      { params },
    );
    return response.data;
  },

  // Chatbot endpoints
  startChatbotSession: async (data: {
    documentId: string;
  }): Promise<ChatbotSessionResponse> => {
    const response = await api.post<ChatbotSessionResponse>(
      "/chatbot/session",
      data,
    );
    return response.data;
  },

  sendChatbotMessage: async (data: {
    sessionId: string;
    message: string;
  }): Promise<ChatbotMessageResponse> => {
    const response = await api.post<ChatbotMessageResponse>(
      "/chatbot/message",
      data,
    );
    return response.data;
  },

  getChatbotSession: async (sessionId: string): Promise<ChatbotSession> => {
    const response = await api.get<ChatbotSession>(
      `/chatbot/session/${sessionId}`,
    );
    return response.data;
  },

  // ReportViewer endpoints
  viewMissingPersonReport: async (
    reportId: string,
  ): Promise<MissingPersonReportResponse> => {
    const response = await api.get<MissingPersonReportResponse>(
      `/report-viewer/missing-person-reports/${reportId}`,
    );
    return response.data;
  },

  listMissingPersonReportsPublic: async (params?: {
    isPublic?: boolean;
    page?: number;
    size?: number;
  }): Promise<PageResponse<MissingPersonReportResponse>> => {
    const response = await api.get<PageResponse<MissingPersonReportResponse>>(
      "/report-viewer/missing-person-reports",
      { params },
    );
    return response.data;
  },

  viewCrimeReport: async (reportId: string): Promise<CrimeReportResponse> => {
    const response = await api.get<CrimeReportResponse>(
      `/report-viewer/crime-reports/${reportId}`,
    );
    return response.data;
  },

  listCrimeReportsPublic: async (params?: {
    isPublic?: boolean;
    page?: number;
    size?: number;
  }): Promise<PageResponse<CrimeReportResponse>> => {
    const response = await api.get<PageResponse<CrimeReportResponse>>(
      "/report-viewer/crime-reports",
      { params },
    );
    return response.data;
  },

  viewGuidelinesDocument: async (
    documentId: string,
  ): Promise<GuidelinesDocumentResponse> => {
    const response = await api.get<GuidelinesDocumentResponse>(
      `/report-viewer/guidelines/${documentId}`,
    );
    return response.data;
  },

  listGuidelinesDocumentsPublic: async (params?: {
    isPublic?: boolean;
    page?: number;
    size?: number;
  }): Promise<PageResponse<GuidelinesDocumentResponse>> => {
    const response = await api.get<PageResponse<GuidelinesDocumentResponse>>(
      "/report-viewer/guidelines",
      { params },
    );
    return response.data;
  },

  // MissingPersonRequestReceiver endpoints
  submitMissingPersonReport: async (
    data: SubmitMissingPersonReportRequest,
  ): Promise<MissingPersonReportResponse> => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("fullName", data.fullName);
    formData.append("personalId", data.personalId);
    formData.append("content", data.content);
    formData.append("contactEmail", data.contactEmail);
    formData.append("contactPhone", data.contactPhone);
    formData.append("date", data.date);
    if (data.latitude != null) formData.append("latitude", data.latitude.toString());
    if (data.longitude != null) formData.append("longitude", data.longitude.toString());
    if (data.photo) formData.append("photo", data.photo);

    const response = await api.post<MissingPersonReportResponse>(
      "/missing-person-request-receiver/submit",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  // ReportAdmin endpoints
  deleteMissingPersonReportAsAdmin: async (reportId: string): Promise<void> => {
    await api.delete(`/report-admin/missing-person-reports/${reportId}`);
  },

  deleteCrimeReportAsAdmin: async (reportId: string): Promise<void> => {
    await api.delete(`/report-admin/crime-reports/${reportId}`);
  },

  deleteGuidelinesDocumentAsAdmin: async (
    documentId: string,
  ): Promise<void> => {
    await api.delete(`/report-admin/guidelines/${documentId}`);
  },

  // CriminalAnalyzer endpoints
  getDashboardSummary: async (): Promise<DashboardSummaryResponse> => {
    const response = await api.get<DashboardSummaryResponse>(
      "/criminal-analyzer/dashboard",
    );
    return response.data;
  },

  generateCrimeAnalysisReport: async (
    startDate: string,
    endDate: string,
  ): Promise<CrimeAnalysisReportResponse> => {
    const response = await api.get<CrimeAnalysisReportResponse>(
      "/criminal-analyzer/crime-analysis",
      { params: { startDate, endDate } },
    );
    return response.data;
  },

  // CrimeLocator endpoints
  viewCrimeHeatmap: async (
    longitude: number,
    latitude: number,
    radius?: number,
    page?: number,
    size?: number,
  ): Promise<PageResponse<CrimeReportResponse>> => {
    const response = await api.get<PageResponse<CrimeReportResponse>>(
      "/crime-locator/heatmap",
      {
        params: { longitude, latitude, radius: radius || 5000, page, size },
      },
    );
    return response.data;
  },

  checkIfInsideHighRiskCrimeZone: async (
    longitude: number,
    latitude: number,
  ): Promise<boolean> => {
    const response = await api.get<boolean>("/crime-locator/high-risk-check", {
      params: { longitude, latitude },
    });
    return response.data;
  },

  // File endpoints
  uploadFile: async (
    file: File,
    bucket?: string,
  ): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    if (bucket) formData.append("bucket", bucket);
    const response = await api.post<FileUploadResponse>(
      "/file/upload",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  /**
   * Upload a file scoped to a document.
   * HTML files are stored as {documentId}/index.html; others as {documentId}/{originalFilename}.
   */
  uploadDocumentFile: async (
    documentId: string,
    file: File,
  ): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<FileUploadResponse>(
      `/file/document/${documentId}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  /** Delete all files in a document's folder ({documentId}/) */
  deleteDocumentFolder: async (documentId: string): Promise<void> => {
    await api.delete(`/file/document/${documentId}`);
  },

  deleteFile: async (bucket: string, filename: string): Promise<void> => {
    await api.delete(`/file/${bucket}/${filename}`);
  },

  getFileUrl: async (bucket: string, filename: string): Promise<string> => {
    const response = await api.get<string>(`/file/${bucket}/${filename}`);
    return response.data;
  },

  getMissingPersonPhotoUrl: (reportId: string): string =>
    `${API_URL}/report-viewer/missing-person-reports/${reportId}/photo`,

  getCrimeReportPhotoUrl: (reportId: string, objectName: string): string =>
    `${API_URL}/report-viewer/crime-reports/${reportId}/photos/${encodeURIComponent(objectName)}`,
};
