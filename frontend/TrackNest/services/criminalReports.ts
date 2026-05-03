import type {
  ChatbotMessageResponse,
  ChatbotSessionResponse,
  CreateCrimeReportInput,
  CreateMissingPersonReportInput,
  CrimeAnalysisReportResponse,
  CrimeReport,
  CrimeReportsQuery,
  DashboardSummaryResponse,
  GuidelinesDocument,
  MissingPersonReport,
  NearbyCrimeReportsQuery,
  PageResponse,
  SubmitCrimeReportUserParams,
  SubmitMissingPersonReportParams,
  SubmitMissingPersonReportUserParams,
  UpdateCrimeReportInput,
  UpdateGuidelinesDocumentInput,
  UpdateMissingPersonReportInput,
} from "@/types/criminalReports";
import { getCriminalUrl } from "@/utils";
import { getAuthMetadata, getUserId } from "@/utils/auth";
import axios from "axios";
export type {
  ChatbotMessageResponse,
  ChatbotSessionMessage,
  ChatbotSessionResponse,
  CreateCrimeReportInput,
  CreateMissingPersonReportInput,
  CrimeAnalysisReportResponse,
  CrimeReport,
  CrimeReportsQuery,
  CrimeTrendPoint,
  DashboardSummaryResponse,
  FileUploadResponse,
  GuidelinesDocument,
  HotspotArea,
  MissingPersonReport,
  NearbyCrimeReportsQuery,
  PageResponse,
  SubmitCrimeReportUserParams,
  SubmitMissingPersonReportParams,
  SubmitMissingPersonReportUserParams,
  UpdateCrimeReportInput,
  UpdateGuidelinesDocumentInput,
  UpdateMissingPersonReportInput,
} from "@/types/criminalReports";

class CriminalReportsService {
  private baseUrl: string = "";

  private async getApiClient() {
    if (!this.baseUrl) {
      this.baseUrl = await getCriminalUrl();
    }

    console.log("Using criminal reports service URL:", this.baseUrl);

    const authMetadata = await getAuthMetadata();
    return axios.create({
      baseURL: this.baseUrl,
      headers: authMetadata,
    });
  }

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
    const client = await this.getMutationClient();
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
    const client = await this.getMutationClient();
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

  async submitMissingPersonReport(
    params: SubmitMissingPersonReportParams,
  ): Promise<MissingPersonReport> {
    const client = await this.getApiClient();
    const { photo, ...textParams } = params;

    const formData = new FormData();
    Object.entries(textParams).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, String(value));
    });
    if (photo) {
      formData.append("photo", {
        uri: photo.uri,
        name: photo.filename,
        type: photo.type,
      } as any);
    }

    const response = await client.post(
      "/missing-person-request-receiver/submit",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
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

  // ==================== Report Viewer ====================

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

  // ==================== Admin ====================

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

  // ==================== Report User ====================

  async getUserCrimeReports(
    page: number = 0,
    size: number = 10,
  ): Promise<PageResponse<CrimeReport>> {
    const client = await this.getApiClient();
    const response = await client.get("/report-user/crime-reports", {
      params: { page, size },
    });
    return response.data;
  }

  async getUserMissingPersonReports(
    page: number = 0,
    size: number = 10,
  ): Promise<PageResponse<MissingPersonReport>> {
    const client = await this.getApiClient();
    const response = await client.get("/report-user/missing-person-reports", {
      params: { page, size },
    });
    return response.data;
  }

  async getUserGuidelines(
    page: number = 0,
    size: number = 10,
  ): Promise<PageResponse<GuidelinesDocument>> {
    const client = await this.getApiClient();
    const response = await client.get("/report-user/guidelines", {
      params: { page, size },
    });
    return response.data;
  }

  async getUserCrimeReportById(reportId: string): Promise<CrimeReport> {
    const client = await this.getApiClient();
    const response = await client.get(`/report-user/crime-reports/${reportId}`);
    return response.data;
  }

  async getUserMissingPersonReportById(reportId: string): Promise<MissingPersonReport> {
    const client = await this.getApiClient();
    const response = await client.get(`/report-user/missing-person-reports/${reportId}`);
    return response.data;
  }

  async getUserGuidelinesById(documentId: string): Promise<GuidelinesDocument> {
    const client = await this.getApiClient();
    const response = await client.get(`/report-user/guidelines/${documentId}`);
    return response.data;
  }

  async submitUserCrimeReport(
    params: SubmitCrimeReportUserParams,
  ): Promise<CrimeReport> {
    const client = await this.getMutationClient();
    const formData = new FormData();
    formData.append("title", params.title);
    if (params.content) formData.append("content", params.content);
    formData.append("severity", String(params.severity));
    formData.append("date", params.date);
    formData.append("longitude", String(params.longitude));
    formData.append("latitude", String(params.latitude));
    formData.append("numberOfVictims", String(params.numberOfVictims ?? 0));
    formData.append("numberOfOffenders", String(params.numberOfOffenders ?? 0));
    formData.append("arrested", String(params.arrested ?? false));
    if (params.photos) {
      for (const photo of params.photos) {
        formData.append("photos", {
          uri: photo.uri,
          name: photo.filename ?? "photo.jpg",
          type: photo.type ?? "image/jpeg",
        } as any);
      }
    }
    const response = await client.post("/report-user/crime-reports", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  async submitUserMissingPersonReport(
    params: SubmitMissingPersonReportUserParams,
  ): Promise<MissingPersonReport> {
    const client = await this.getMutationClient();
    const formData = new FormData();
    formData.append("title", params.title);
    formData.append("fullName", params.fullName);
    formData.append("personalId", params.personalId);
    formData.append("content", params.content);
    formData.append("contactEmail", params.contactEmail);
    formData.append("contactPhone", params.contactPhone);
    formData.append("date", params.date);
    formData.append("latitude", String(params.latitude));
    formData.append("longitude", String(params.longitude));
    if (params.photo) {
      formData.append("photo", {
        uri: params.photo.uri,
        name: params.photo.filename ?? "photo.jpg",
        type: params.photo.type ?? "image/jpeg",
      } as any);
    }
    const response = await client.post(
      "/report-user/missing-person-reports",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  }

  // ==================== Chatbot ====================

  async startChatbotSession(params: {
    documentId: string;
  }): Promise<{ sessionId: string }> {
    const client = await this.getMutationClient();
    const response = await client.post("/chatbot/sessions", params);
    return response.data;
  }

  async sendChatbotMessage(params: {
    sessionId: string;
    message: string;
  }): Promise<ChatbotMessageResponse> {
    const client = await this.getMutationClient();
    const response = await client.post(
      `/chatbot/sessions/${params.sessionId}/messages`,
      { message: params.message },
    );
    return response.data;
  }

  async getChatbotSession(sessionId: string): Promise<ChatbotSessionResponse> {
    const client = await this.getApiClient();
    const response = await client.get(`/chatbot/sessions/${sessionId}`);
    return response.data;
  }
}

export const criminalReportsService = new CriminalReportsService();
export default criminalReportsService;
