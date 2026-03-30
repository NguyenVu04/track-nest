import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_CRIMINAL_REPORTS_API_URL || "http://localhost:28080";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface CreateMissingPersonReportRequest {
  title: string;
  fullName: string;
  personalId: string;
  photo?: string;
  date: string;
  content: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface MissingPersonReportResponse {
  id: string;
  title: string;
  fullName: string;
  personalId: string;
  photo: string;
  date: string;
  content: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  userId: string;
  status: string;
  reporterId: string;
  isPublic: boolean;
}

export interface CreateCrimeReportRequest {
  title: string;
  content: string;
  severity: number;
  date: string;
  longitude: number;
  latitude: number;
  numberOfVictims: number;
  numberOfOffenders: number;
  arrested: boolean;
}

export interface CrimeReportResponse {
  id: string;
  title: string;
  content: string;
  severity: number;
  date: string;
  longitude: number;
  latitude: number;
  numberOfVictims: number;
  numberOfOffenders: number;
  arrested: boolean;
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

export interface GuidelinesDocumentResponse {
  id: string;
  title: string;
  abstractText: string;
  content: string;
  createdAt: string;
  reporterId: string;
  isPublic: boolean;
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

export const criminalReportsService = {
  createMissingPersonReport: async (
    data: CreateMissingPersonReportRequest
  ): Promise<MissingPersonReportResponse> => {
    const response = await api.post<MissingPersonReportResponse>(
      "/report-manager/missing-person-reports",
      data
    );
    return response.data;
  },

  getMissingPersonReport: async (
    reportId: string
  ): Promise<MissingPersonReportResponse> => {
    const response = await api.get<MissingPersonReportResponse>(
      `/report-manager/missing-person-reports/${reportId}`
    );
    return response.data;
  },

  deleteMissingPersonReport: async (reportId: string): Promise<void> => {
    await api.delete(`/report-manager/missing-person-reports/${reportId}`);
  },

  publishMissingPersonReport: async (
    reportId: string
  ): Promise<MissingPersonReportResponse> => {
    const response = await api.post<MissingPersonReportResponse>(
      `/report-manager/missing-person-reports/${reportId}/publish`
    );
    return response.data;
  },

  listMissingPersonReports: async (
    params?: {
      reporterId?: string;
      status?: string;
      isPublic?: boolean;
      page?: number;
      size?: number;
    }
  ): Promise<PageResponse<MissingPersonReportResponse>> => {
    const response = await api.get<PageResponse<MissingPersonReportResponse>>(
      "/report-manager/missing-person-reports",
      { params }
    );
    return response.data;
  },

  createCrimeReport: async (
    data: CreateCrimeReportRequest
  ): Promise<CrimeReportResponse> => {
    const response = await api.post<CrimeReportResponse>(
      "/report-manager/crime-reports",
      data
    );
    return response.data;
  },

  getCrimeReport: async (
    reportId: string
  ): Promise<CrimeReportResponse> => {
    const response = await api.get<CrimeReportResponse>(
      `/report-manager/crime-reports/${reportId}`
    );
    return response.data;
  },

  publishCrimeReport: async (
    reportId: string
  ): Promise<CrimeReportResponse> => {
    const response = await api.post<CrimeReportResponse>(
      `/report-manager/crime-reports/${reportId}/publish`
    );
    return response.data;
  },

  deleteCrimeReport: async (reportId: string): Promise<void> => {
    await api.delete(`/report-manager/crime-reports/${reportId}`);
  },

  listCrimeReports: async (
    params?: {
      reporterId?: string;
      minSeverity?: number;
      isPublic?: boolean;
      page?: number;
      size?: number;
    }
  ): Promise<PageResponse<CrimeReportResponse>> => {
    const response = await api.get<PageResponse<CrimeReportResponse>>(
      "/report-manager/crime-reports",
      { params }
    );
    return response.data;
  },

  listCrimeReportsNearby: async (
    longitude: number,
    latitude: number,
    radius?: number,
    page?: number,
    size?: number
  ): Promise<PageResponse<CrimeReportResponse>> => {
    const response = await api.get<PageResponse<CrimeReportResponse>>(
      "/report-manager/crime-reports/nearby",
      {
        params: { longitude, latitude, radius: radius || 5000, page, size },
      }
    );
    return response.data;
  },

  createGuidelinesDocument: async (
    data: CreateGuidelinesDocumentRequest
  ): Promise<GuidelinesDocumentResponse> => {
    const response = await api.post<GuidelinesDocumentResponse>(
      "/report-manager/guidelines",
      data
    );
    return response.data;
  },

  getGuidelinesDocument: async (
    documentId: string
  ): Promise<GuidelinesDocumentResponse> => {
    const response = await api.get<GuidelinesDocumentResponse>(
      `/report-manager/guidelines/${documentId}`
    );
    return response.data;
  },

  publishGuidelinesDocument: async (
    documentId: string
  ): Promise<GuidelinesDocumentResponse> => {
    const response = await api.post<GuidelinesDocumentResponse>(
      `/report-manager/guidelines/${documentId}/publish`
    );
    return response.data;
  },

  deleteGuidelinesDocument: async (documentId: string): Promise<void> => {
    await api.delete(`/report-manager/guidelines/${documentId}`);
  },

  listGuidelinesDocuments: async (
    params?: {
      reporterId?: string;
      isPublic?: boolean;
      page?: number;
      size?: number;
    }
  ): Promise<PageResponse<GuidelinesDocumentResponse>> => {
    const response = await api.get<PageResponse<GuidelinesDocumentResponse>>(
      "/report-manager/guidelines",
      { params }
    );
    return response.data;
  },

  // ReportViewer endpoints
  viewMissingPersonReport: async (
    reportId: string
  ): Promise<MissingPersonReportResponse> => {
    const response = await api.get<MissingPersonReportResponse>(
      `/report-viewer/missing-person-reports/${reportId}`
    );
    return response.data;
  },

  viewCrimeReport: async (
    reportId: string
  ): Promise<CrimeReportResponse> => {
    const response = await api.get<CrimeReportResponse>(
      `/report-viewer/crime-reports/${reportId}`
    );
    return response.data;
  },

  viewGuidelinesDocument: async (
    documentId: string
  ): Promise<GuidelinesDocumentResponse> => {
    const response = await api.get<GuidelinesDocumentResponse>(
      `/report-viewer/guidelines/${documentId}`
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

  deleteGuidelinesDocumentAsAdmin: async (documentId: string): Promise<void> => {
    await api.delete(`/report-admin/guidelines/${documentId}`);
  },

  // CriminalAnalyzer endpoints
  generateCrimeAnalysisReport: async (
    startDate: string,
    endDate: string
  ): Promise<CrimeAnalysisReportResponse> => {
    const response = await api.get<CrimeAnalysisReportResponse>(
      "/criminal-analyzer/crime-analysis",
      { params: { startDate, endDate } }
    );
    return response.data;
  },

  // CrimeLocator endpoints
  viewCrimeHeatmap: async (
    longitude: number,
    latitude: number,
    radius?: number,
    page?: number,
    size?: number
  ): Promise<PageResponse<CrimeReportResponse>> => {
    const response = await api.get<PageResponse<CrimeReportResponse>>(
      "/crime-locator/heatmap",
      {
        params: { longitude, latitude, radius: radius || 5000, page, size },
      }
    );
    return response.data;
  },

  checkIfInsideHighRiskCrimeZone: async (
    longitude: number,
    latitude: number
  ): Promise<boolean> => {
    const response = await api.get<boolean>(
      "/crime-locator/high-risk-check",
      { params: { longitude, latitude } }
    );
    return response.data;
  },
};

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
