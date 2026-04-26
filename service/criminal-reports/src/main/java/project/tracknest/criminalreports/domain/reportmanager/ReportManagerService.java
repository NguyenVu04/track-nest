package project.tracknest.criminalreports.domain.reportmanager;

import project.tracknest.criminalreports.core.datatype.PageResponse;
import project.tracknest.criminalreports.domain.reportmanager.dto.*;
import project.tracknest.criminalreports.domain.reportmanager.dto.CrimeReportResponse;
import project.tracknest.criminalreports.domain.reportmanager.dto.GuidelinesDocumentResponse;
import project.tracknest.criminalreports.domain.reportmanager.dto.MissingPersonReportResponse;

import java.util.UUID;

public interface ReportManagerService {
    MissingPersonReportResponse createMissingPersonReport(UUID reporterId, CreateMissingPersonReportRequest request);
    MissingPersonReportResponse getMissingPersonReport(UUID reporterId, UUID reportId);
    MissingPersonReportResponse updateMissingPersonReport(UUID reporterId, UUID reportId, UpdateMissingPersonReportRequest request);
    void deleteMissingPersonReport(UUID reporterId, UUID reportId);
    MissingPersonReportResponse publishMissingPersonReport(UUID reporterId, UUID reportId);
    MissingPersonReportResponse rejectMissingPersonReport(UUID reporterId, UUID reportId);
    PageResponse<MissingPersonReportResponse> listMissingPersonReports(UUID reporterId, String status, boolean isPublic, int page, int size);

    CrimeReportResponse createCrimeReport(UUID reporterId, CreateCrimeReportRequest request);
    CrimeReportResponse getCrimeReport(UUID reporterId, UUID reportId);
    CrimeReportResponse updateCrimeReport(UUID reporterId, UUID reportId, UpdateCrimeReportRequest request);
    CrimeReportResponse publishCrimeReport(UUID reporterId, UUID reportId);
    void deleteCrimeReport(UUID reporterId, UUID reportId);
    PageResponse<CrimeReportResponse> listCrimeReports(UUID reporterId, Integer minSeverity, boolean isPublic, int page, int size);
    PageResponse<CrimeReportResponse> listCrimeReportsWithinRadius(double longitude, double latitude, double radius, int page, int size);

    GuidelinesDocumentResponse createGuidelinesDocument(UUID reporterId, CreateGuidelinesDocumentRequest request);
    GuidelinesDocumentResponse getGuidelinesDocument(UUID reporterId, UUID documentId);
    GuidelinesDocumentResponse updateGuidelinesDocument(UUID reporterId, UUID documentId, UpdateGuidelinesDocumentRequest request);
    GuidelinesDocumentResponse publishGuidelinesDocument(UUID reporterId, UUID documentId);
    void deleteGuidelinesDocument(UUID reporterId, UUID documentId);
    PageResponse<GuidelinesDocumentResponse> listGuidelinesDocuments(UUID reporterId, boolean isPublic, int page, int size);
}
