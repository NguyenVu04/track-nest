package project.tracknest.criminalreports.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.tracknest.criminalreports.configuration.security.SecurityUtils;
import project.tracknest.criminalreports.core.datatype.PageResponse;
import project.tracknest.criminalreports.domain.reportmanager.ReportManagerService;
import project.tracknest.criminalreports.domain.reportmanager.dto.*;
import project.tracknest.criminalreports.domain.reportmanager.dto.CrimeReportResponse;
import project.tracknest.criminalreports.domain.reportmanager.dto.GuidelinesDocumentResponse;
import project.tracknest.criminalreports.domain.reportmanager.dto.MissingPersonReportResponse;

import java.util.UUID;

@RestController
@RequestMapping("/report-manager")
@RequiredArgsConstructor
public class ReportManagerController {
    private final ReportManagerService service;

    @PostMapping("/missing-person-reports")
    public ResponseEntity<MissingPersonReportResponse> createMissingPersonReport(
            @Valid @RequestBody CreateMissingPersonReportRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(service.createMissingPersonReport(userId, request));
    }

    @GetMapping("/missing-person-reports/{reportId}")
    public ResponseEntity<MissingPersonReportResponse> getMissingPersonReport(
            @PathVariable UUID reportId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(service.getMissingPersonReport(userId, reportId));
    }

    @PutMapping("/missing-person-reports/{reportId}")
    public ResponseEntity<MissingPersonReportResponse> updateMissingPersonReport(
            @PathVariable UUID reportId,
            @Valid @RequestBody UpdateMissingPersonReportRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(service.updateMissingPersonReport(userId, reportId, request));
    }

    @DeleteMapping("/missing-person-reports/{reportId}")
    public ResponseEntity<Void> deleteMissingPersonReport(
            @PathVariable UUID reportId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        service.deleteMissingPersonReport(userId, reportId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/missing-person-reports/{reportId}/publish")
    public ResponseEntity<MissingPersonReportResponse> publishMissingPersonReport(
            @PathVariable UUID reportId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(service.publishMissingPersonReport(userId, reportId));
    }

    @PostMapping("/missing-person-reports/{reportId}/reject")
    public ResponseEntity<MissingPersonReportResponse> rejectMissingPersonReport(
            @PathVariable UUID reportId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(service.rejectMissingPersonReport(userId, reportId));
    }

    @GetMapping("/missing-person-reports")
    public ResponseEntity<PageResponse<MissingPersonReportResponse>> listMissingPersonReports(
            @RequestParam(required = false) UUID reporterId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "false") boolean isPublic,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(service.listMissingPersonReports(reporterId, status, isPublic, page, Math.min(size, 100)));
    }

    @PostMapping("/crime-reports")
    public ResponseEntity<CrimeReportResponse> createCrimeReport(
            @Valid @RequestBody CreateCrimeReportRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(service.createCrimeReport(userId, request));
    }

    @GetMapping("/crime-reports/{reportId}")
    public ResponseEntity<CrimeReportResponse> getCrimeReport(
            @PathVariable UUID reportId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(service.getCrimeReport(userId, reportId));
    }

    @PutMapping("/crime-reports/{reportId}")
    public ResponseEntity<CrimeReportResponse> updateCrimeReport(
            @PathVariable UUID reportId,
            @Valid @RequestBody UpdateCrimeReportRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(service.updateCrimeReport(userId, reportId, request));
    }

    @PostMapping("/crime-reports/{reportId}/publish")
    public ResponseEntity<CrimeReportResponse> publishCrimeReport(
            @PathVariable UUID reportId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(service.publishCrimeReport(userId, reportId));
    }

    @DeleteMapping("/crime-reports/{reportId}")
    public ResponseEntity<Void> deleteCrimeReport(
            @PathVariable UUID reportId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        service.deleteCrimeReport(userId, reportId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/crime-reports")
    public ResponseEntity<PageResponse<CrimeReportResponse>> listCrimeReports(
            @RequestParam(required = false) UUID reporterId,
            @RequestParam(required = false) Integer minSeverity,
            @RequestParam(defaultValue = "false") boolean isPublic,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(service.listCrimeReports(reporterId, minSeverity, isPublic, page, Math.min(size, 100)));
    }

    @GetMapping("/crime-reports/nearby")
    public ResponseEntity<PageResponse<CrimeReportResponse>> listCrimeReportsNearby(
            @RequestParam double longitude,
            @RequestParam double latitude,
            @RequestParam(defaultValue = "5000") double radius,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(service.listCrimeReportsWithinRadius(longitude, latitude, radius, page, Math.min(size, 100)));
    }

    @PostMapping("/guidelines")
    public ResponseEntity<GuidelinesDocumentResponse> createGuidelinesDocument(
            @Valid @RequestBody CreateGuidelinesDocumentRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(service.createGuidelinesDocument(userId, request));
    }

    @GetMapping("/guidelines/{documentId}")
    public ResponseEntity<GuidelinesDocumentResponse> getGuidelinesDocument(
            @PathVariable UUID documentId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(service.getGuidelinesDocument(userId, documentId));
    }

    @PutMapping("/guidelines/{documentId}")
    public ResponseEntity<GuidelinesDocumentResponse> updateGuidelinesDocument(
            @PathVariable UUID documentId,
            @Valid @RequestBody UpdateGuidelinesDocumentRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(service.updateGuidelinesDocument(userId, documentId, request));
    }

    @PostMapping("/guidelines/{documentId}/publish")
    public ResponseEntity<GuidelinesDocumentResponse> publishGuidelinesDocument(
            @PathVariable UUID documentId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(service.publishGuidelinesDocument(userId, documentId));
    }

    @DeleteMapping("/guidelines/{documentId}")
    public ResponseEntity<Void> deleteGuidelinesDocument(
            @PathVariable UUID documentId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        service.deleteGuidelinesDocument(userId, documentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/guidelines")
    public ResponseEntity<PageResponse<GuidelinesDocumentResponse>> listGuidelinesDocuments(
            @RequestParam(required = false) UUID reporterId,
            @RequestParam(defaultValue = "false") boolean isPublic,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(service.listGuidelinesDocuments(reporterId, isPublic, page, Math.min(size, 100)));
    }
}
