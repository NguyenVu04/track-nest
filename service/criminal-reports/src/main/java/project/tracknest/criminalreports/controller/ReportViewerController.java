package project.tracknest.criminalreports.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.tracknest.criminalreports.core.datatype.PageResponse;
import project.tracknest.criminalreports.domain.reportmanager.dto.CrimeReportResponse;
import project.tracknest.criminalreports.domain.reportmanager.dto.GuidelinesDocumentResponse;
import project.tracknest.criminalreports.domain.reportmanager.dto.MissingPersonReportResponse;
import project.tracknest.criminalreports.domain.reportviewer.ReportViewerService;

import java.util.UUID;

@RestController
@RequestMapping("/report-viewer")
@RequiredArgsConstructor
public class ReportViewerController {
    private final ReportViewerService service;

    @GetMapping("/missing-person-reports/{reportId}")
    public ResponseEntity<MissingPersonReportResponse> viewMissingPersonReport(
            @PathVariable UUID reportId) {
        MissingPersonReportResponse response = service.viewMissingPersonReport(reportId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/missing-person-reports")
    public ResponseEntity<PageResponse<MissingPersonReportResponse>> listMissingPersonReports(
            @RequestParam(defaultValue = "false") boolean isPublic,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<MissingPersonReportResponse> response = service.listMissingPersonReports(isPublic, page, Math.min(size, 100));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/crime-reports/{reportId}")
    public ResponseEntity<CrimeReportResponse> viewCrimeReport(
            @PathVariable UUID reportId) {
        CrimeReportResponse response = service.viewCrimeReport(reportId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/crime-reports")
    public ResponseEntity<PageResponse<CrimeReportResponse>> listCrimeReports(
            @RequestParam(defaultValue = "false") boolean isPublic,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<CrimeReportResponse> response = service.listCrimeReports(isPublic, page, Math.min(size, 100));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/guidelines/{documentId}")
    public ResponseEntity<GuidelinesDocumentResponse> viewGuidelinesDocument(
            @PathVariable UUID documentId) {
        GuidelinesDocumentResponse response = service.viewGuidelinesDocument(documentId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/guidelines")
    public ResponseEntity<PageResponse<GuidelinesDocumentResponse>> listGuidelinesDocuments(
            @RequestParam(defaultValue = "false") boolean isPublic,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<GuidelinesDocumentResponse> response = service.listGuidelinesDocuments(isPublic, page, Math.min(size, 100));
        return ResponseEntity.ok(response);
    }
}
