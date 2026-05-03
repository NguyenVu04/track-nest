import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import type {
  CrimeReport,
  MissingPersonReport,
  GuidelinesDocument,
  CreateCrimeReportInput,
  CreateMissingPersonReportInput,
} from "@/types/criminalReports";
import { criminalReportsService } from "@/services/criminalReports";
import { minioService } from "@/services/mediaUpload";
import { getSeverityLabel, getSeverityColor } from "@/utils/crimeHelpers";
import { useAuth } from "./AuthContext";

interface ReportsContextType {
  // Crime Reports
  crimeReports: CrimeReport[];
  isLoadingCrimeReports: boolean;
  crimeReportsError: string | null;
  fetchCrimeReports: (page?: number, size?: number) => Promise<void>;
  fetchNearbyCrimeReports: (
    lat: number,
    lng: number,
    radius?: number,
  ) => Promise<void>;
  createCrimeReport: (data: CreateCrimeReportInput) => Promise<CrimeReport>;
  deleteCrimeReport: (reportId: string) => Promise<void>;

  // Missing Person Reports
  missingPersonReports: MissingPersonReport[];
  isLoadingMissingPersons: boolean;
  missingPersonsError: string | null;
  fetchMissingPersonReports: (page?: number, size?: number) => Promise<void>;
  createMissingPersonReport: (
    data: CreateMissingPersonReportInput,
    photoUri?: string,
  ) => Promise<MissingPersonReport>;
  deleteMissingPersonReport: (reportId: string) => Promise<void>;

  // Guidelines
  guidelines: GuidelinesDocument[];
  isLoadingGuidelines: boolean;
  fetchGuidelines: (page?: number, size?: number) => Promise<void>;

  // Helpers
  getSeverityLabel: (severity: number) => string;
  getSeverityColor: (severity: number) => string;

  // Clear errors
  clearErrors: () => void;
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

export const useReports = (): ReportsContextType => {
  const context = useContext(ReportsContext);
  if (context === undefined) {
    throw new Error("useReports must be used within a ReportsProvider");
  }
  return context;
};

interface ReportsProviderProps {
  children: ReactNode;
}

export const ReportsProvider: React.FC<ReportsProviderProps> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();

  // Crime Reports State
  const [crimeReports, setCrimeReports] = useState<CrimeReport[]>([]);
  const [isLoadingCrimeReports, setIsLoadingCrimeReports] = useState(false);
  const [crimeReportsError, setCrimeReportsError] = useState<string | null>(
    null,
  );

  // Missing Person Reports State
  const [missingPersonReports, setMissingPersonReports] = useState<
    MissingPersonReport[]
  >([]);
  const [isLoadingMissingPersons, setIsLoadingMissingPersons] = useState(false);
  const [missingPersonsError, setMissingPersonsError] = useState<string | null>(
    null,
  );

  // Guidelines State
  const [guidelines, setGuidelines] = useState<GuidelinesDocument[]>([]);
  const [isLoadingGuidelines, setIsLoadingGuidelines] = useState(false);

  // ==================== Crime Reports Functions ====================

  const fetchCrimeReports = useCallback(
    async (page: number = 0, size: number = 20) => {
      setIsLoadingCrimeReports(true);
      setCrimeReportsError(null);
      try {
        const response = await criminalReportsService.getUserCrimeReports(
          page,
          size,
        );
        setCrimeReports(response.content);
      } catch (error: any) {
        console.error("Failed to fetch crime reports:", error);
        setCrimeReportsError(error?.message || "Failed to fetch crime reports");
        // Fallback to empty array on error
        setCrimeReports([]);
      } finally {
        setIsLoadingCrimeReports(false);
      }
    },
    [],
  );

  const fetchNearbyCrimeReports = useCallback(
    async (lat: number, lng: number, radius: number = 5000) => {
      setIsLoadingCrimeReports(true);
      setCrimeReportsError(null);
      try {
        const response = await criminalReportsService.getNearbyCrimeReports({
          latitude: lat,
          longitude: lng,
          radius,
        });
        setCrimeReports(response.content);
      } catch (error: any) {
        console.error("Failed to fetch nearby crime reports:", error);
        setCrimeReportsError(
          error?.message || "Failed to fetch nearby crime reports",
        );
        setCrimeReports([]);
      } finally {
        setIsLoadingCrimeReports(false);
      }
    },
    [],
  );

  const createCrimeReport = useCallback(
    async (data: CreateCrimeReportInput): Promise<CrimeReport> => {
      const newReport = await criminalReportsService.createCrimeReport(data);
      // Refresh the list after creating
      await fetchCrimeReports();
      return newReport;
    },
    [fetchCrimeReports],
  );

  const deleteCrimeReport = useCallback(
    async (reportId: string): Promise<void> => {
      await criminalReportsService.deleteCrimeReport(reportId);
      // Refresh the list after deleting
      setCrimeReports((prev) =>
        prev.filter((report) => report.id !== reportId),
      );
    },
    [],
  );

  // ==================== Missing Person Reports Functions ====================

  const fetchMissingPersonReports = useCallback(
    async (page: number = 0, size: number = 20) => {
      setIsLoadingMissingPersons(true);
      setMissingPersonsError(null);
      try {
        const response = await criminalReportsService.getUserMissingPersonReports(
          page,
          size,
        );
        setMissingPersonReports(response.content);
      } catch (error: any) {
        console.error("Failed to fetch missing person reports:", error);
        setMissingPersonsError(
          error?.message || "Failed to fetch missing person reports",
        );
        setMissingPersonReports([]);
      } finally {
        setIsLoadingMissingPersons(false);
      }
    },
    [],
  );

  const createMissingPersonReport = useCallback(
    async (
      data: CreateMissingPersonReportInput,
      photoUri?: string,
    ): Promise<MissingPersonReport> => {
      let photoUrl: string | undefined;

      // Upload photo if provided
      if (photoUri) {
        try {
          const result = await minioService.uploadFile({
            uri: photoUri,
            filename: `missing_person_${Date.now()}.jpg`,
            type: "image/jpeg",
          });
          photoUrl = result.url;
        } catch (error) {
          console.error("Failed to upload photo:", error);
          // Continue without photo if upload fails
        }
      }

      // Create report with photo URL if available
      const reportData = photoUrl ? { ...data, photo: photoUrl } : data;
      const newReport =
        await criminalReportsService.createMissingPersonReport(reportData);

      // Refresh the list
      await fetchMissingPersonReports();

      return newReport;
    },
    [fetchMissingPersonReports],
  );

  const deleteMissingPersonReport = useCallback(
    async (reportId: string): Promise<void> => {
      await criminalReportsService.deleteMissingPersonReport(reportId);
      setMissingPersonReports((prev) =>
        prev.filter((report) => report.id !== reportId),
      );
    },
    [],
  );

  // ==================== Guidelines Functions ====================

  const fetchGuidelines = useCallback(
    async (page: number = 0, size: number = 20) => {
      setIsLoadingGuidelines(true);
      try {
        const response = await criminalReportsService.getUserGuidelines(page, size);
        setGuidelines(response.content);
      } catch (error) {
        console.error("Failed to fetch guidelines:", error);
        setGuidelines([]);
      } finally {
        setIsLoadingGuidelines(false);
      }
    },
    [],
  );

  // ==================== Utility Functions ====================

  const clearErrors = useCallback(() => {
    setCrimeReportsError(null);
    setMissingPersonsError(null);
  }, []);

  // Initial data loading when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCrimeReports();
      fetchMissingPersonReports();
      fetchGuidelines();
    }
  }, [
    isAuthenticated,
    fetchCrimeReports,
    fetchMissingPersonReports,
    fetchGuidelines,
  ]);

  // Context value
  const contextValue: ReportsContextType = {
    // Crime Reports
    crimeReports,
    isLoadingCrimeReports,
    crimeReportsError,
    fetchCrimeReports,
    fetchNearbyCrimeReports,
    createCrimeReport,
    deleteCrimeReport,

    // Missing Person Reports
    missingPersonReports,
    isLoadingMissingPersons,
    missingPersonsError,
    fetchMissingPersonReports,
    createMissingPersonReport,
    deleteMissingPersonReport,

    // Guidelines
    guidelines,
    isLoadingGuidelines,
    fetchGuidelines,

    // Helpers
    getSeverityLabel,
    getSeverityColor,

    // Utility
    clearErrors,
  };

  return (
    <ReportsContext.Provider value={contextValue}>
      {children}
    </ReportsContext.Provider>
  );
};

export default ReportsContext;
