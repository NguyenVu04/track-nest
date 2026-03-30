package project.tracknest.criminalreports.domain.reportviewer;

import project.tracknest.criminalreports.core.datatype.PageResponse;
import project.tracknest.criminalreports.domain.reportmanager.dto.CrimeReportResponse;
import project.tracknest.criminalreports.domain.reportmanager.dto.GuidelinesDocumentResponse;
import project.tracknest.criminalreports.domain.reportmanager.dto.MissingPersonReportResponse;

import java.util.UUID;

public interface ReportViewerService {
    MissingPersonReportResponse viewMissingPersonReport(UUID reportId);
    CrimeReportResponse viewCrimeReport(UUID reportId);
    GuidelinesDocumentResponse viewGuidelinesDocument(UUID documentId);
    PageResponse<MissingPersonReportResponse> listMissingPersonReports(boolean isPublic, int page, int size);
    PageResponse<CrimeReportResponse> listCrimeReports(boolean isPublic, int page, int size);
    PageResponse<GuidelinesDocumentResponse> listGuidelinesDocuments(boolean isPublic, int page, int size);
}
