export interface CrimeReport {
  id: string;
  title: string;
  content: string;
  severity: number;
  date: string;
  latitude: number;
  longitude: number;
  numberOfVictims: number;
  numberOfOffenders: number;
  arrested: boolean;
  photos?: string[];
  createdAt: string;
  updatedAt: string;
  reporterId: string;
  isPublic: boolean;
}

export interface MissingPersonReport {
  id: string;
  title: string;
  fullName: string;
  personalId: string;
  photo?: string;
  latitude?: number;
  longitude?: number;
  contactEmail?: string;
  contactPhone: string;
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

export interface CreateCrimeReportInput {
  title: string;
  content: string;
  severity: number;
  date: string;
  latitude: number;
  longitude: number;
  numberOfVictims: number;
  numberOfOffenders: number;
  arrested: boolean;
  photos?: string[];
}

export interface UpdateCrimeReportInput {
  title: string;
  content: string;
  severity: number;
  date: string;
  numberOfVictims: number;
  numberOfOffenders: number;
  arrested: boolean;
  photos?: string[];
}

export interface CreateMissingPersonReportInput {
  title: string;
  fullName: string;
  personalId: string;
  contactEmail?: string;
  contactPhone: string;
  date: string;
  content: string;
  photo?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateMissingPersonReportInput {
  title: string;
  fullName: string;
  personalId: string;
  contactEmail?: string;
  contactPhone: string;
  date: string;
  content: string;
  photo?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateGuidelinesDocumentInput {
  title: string;
  abstractText: string;
  content: string;
}

export interface SubmitMissingPersonReportParams {
  title: string;
  fullName: string;
  personalId: string;
  photo?: { uri: string; filename: string; type: string };
  contactEmail: string;
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

export interface CrimeReportsQuery {
  page?: number;
  size?: number;
  isPublic?: boolean;
  minSeverity?: number;
}

export interface NearbyCrimeReportsQuery {
  longitude: number;
  latitude: number;
  radius?: number;
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

export interface ChatbotSessionMessage {
  role: "USER" | "MODEL";
  content: string;
  createdAtMs: number;
}

export interface ChatbotSessionResponse {
  sessionId: string;
  documentId?: string;
  createdAtMs: number;
  messageLeft?: number;
  messages: ChatbotSessionMessage[];
}

export interface ChatbotMessageResponse {
  response: string;
  createdAt: number;
}
