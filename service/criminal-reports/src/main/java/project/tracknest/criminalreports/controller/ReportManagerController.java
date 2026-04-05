package project.tracknest.criminalreports.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
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
            @Valid @RequestBody CreateMissingPersonReportRequest request,
            @RequestHeader("X-User-Id") UUID userId) {
        MissingPersonReportResponse response = service.createMissingPersonReport(userId, request);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/missing-person-reports/{reportId}")
    public ResponseEntity<MissingPersonReportResponse> getMissingPersonReport(
            @PathVariable UUID reportId,
            @RequestHeader("X-User-Id") UUID userId) {
        MissingPersonReportResponse response = service.getMissingPersonReport(userId, reportId);
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/missing-person-reports/{reportId}")
    public ResponseEntity<MissingPersonReportResponse> updateMissingPersonReport(
            @PathVariable UUID reportId,
            @Valid @RequestBody UpdateMissingPersonReportRequest request,
            @RequestHeader("X-User-Id") UUID userId) {
        MissingPersonReportResponse response = service.updateMissingPersonReport(userId, reportId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/missing-person-reports/{reportId}")
    public ResponseEntity<Void> deleteMissingPersonReport(
            @PathVariable UUID reportId,
            @RequestHeader("X-User-Id") UUID userId) {
        service.deleteMissingPersonReport(userId, reportId);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/missing-person-reports/{reportId}/publish")
    public ResponseEntity<MissingPersonReportResponse> publishMissingPersonReport(
            @PathVariable UUID reportId,
            @RequestHeader("X-User-Id") UUID userId) {
        MissingPersonReportResponse response = service.publishMissingPersonReport(userId, reportId);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/missing-person-reports/{reportId}/reject")
    public ResponseEntity<MissingPersonReportResponse> rejectMissingPersonReport(
            @PathVariable UUID reportId,
            @RequestHeader("X-User-Id") UUID userId) {
        MissingPersonReportResponse response = service.rejectMissingPersonReport(userId, reportId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/admin/missing-person-reports/{reportId}")
    public ResponseEntity<Void> deleteMissingPersonReportAsAdmin(
            @PathVariable UUID reportId) {
        service.deleteMissingPersonReportAsAdmin(reportId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/missing-person-reports")
    public ResponseEntity<PageResponse<MissingPersonReportResponse>> listMissingPersonReports(
            @RequestParam(required = false) UUID reporterId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "false") boolean isPublic,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<MissingPersonReportResponse> response = service.listMissingPersonReports(reporterId, status, isPublic, page, size);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/crime-reports")
    public ResponseEntity<CrimeReportResponse> createCrimeReport(
            @Valid @RequestBody CreateCrimeReportRequest request,
            @RequestHeader("X-User-Id") UUID userId) {
        CrimeReportResponse response = service.createCrimeReport(userId, request);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/crime-reports/{reportId}")
    public ResponseEntity<CrimeReportResponse> getCrimeReport(
            @PathVariable UUID reportId,
            @RequestHeader("X-User-Id") UUID userId) {
        CrimeReportResponse response = service.getCrimeReport(userId, reportId);
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/crime-reports/{reportId}")
    public ResponseEntity<CrimeReportResponse> updateCrimeReport(
            @PathVariable UUID reportId,
            @Valid @RequestBody UpdateCrimeReportRequest request,
            @RequestHeader("X-User-Id") UUID userId) {
        CrimeReportResponse response = service.updateCrimeReport(userId, reportId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/crime-reports/{reportId}/publish")
    public ResponseEntity<CrimeReportResponse> publishCrimeReport(
            @PathVariable UUID reportId,
            @RequestHeader("X-User-Id") UUID userId) {
        CrimeReportResponse response = service.publishCrimeReport(userId, reportId);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/crime-reports/{reportId}")
    public ResponseEntity<Void> deleteCrimeReport(
            @PathVariable UUID reportId,
            @RequestHeader("X-User-Id") UUID userId) {
        service.deleteCrimeReport(userId, reportId);
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping("/admin/crime-reports/{reportId}")
    public ResponseEntity<Void> deleteCrimeReportAsAdmin(
            @PathVariable UUID reportId) {
        service.deleteCrimeReportAsAdmin(reportId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/crime-reports")
    public ResponseEntity<PageResponse<CrimeReportResponse>> listCrimeReports(
            @RequestParam(required = false) UUID reporterId,
            @RequestParam(required = false) Integer minSeverity,
            @RequestParam(defaultValue = "false") boolean isPublic,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<CrimeReportResponse> response = service.listCrimeReports(reporterId, minSeverity, isPublic, page, size);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/crime-reports/nearby")
    public ResponseEntity<PageResponse<CrimeReportResponse>> listCrimeReportsNearby(
            @RequestParam double longitude,
            @RequestParam double latitude,
            @RequestParam(defaultValue = "5000") double radius,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<CrimeReportResponse> response = service.listCrimeReportsWithinRadius(longitude, latitude, radius, page, size);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/guidelines")
    public ResponseEntity<GuidelinesDocumentResponse> createGuidelinesDocument(
            @Valid @RequestBody CreateGuidelinesDocumentRequest request,
            @RequestHeader("X-User-Id") UUID userId) {
        GuidelinesDocumentResponse response = service.createGuidelinesDocument(userId, request);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/guidelines/{documentId}")
    public ResponseEntity<GuidelinesDocumentResponse> getGuidelinesDocument(
            @PathVariable UUID documentId,
            @RequestHeader("X-User-Id") UUID userId) {
        GuidelinesDocumentResponse response = service.getGuidelinesDocument(userId, documentId);
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/guidelines/{documentId}")
    public ResponseEntity<GuidelinesDocumentResponse> updateGuidelinesDocument(
            @PathVariable UUID documentId,
            @Valid @RequestBody UpdateGuidelinesDocumentRequest request,
            @RequestHeader("X-User-Id") UUID userId) {
        GuidelinesDocumentResponse response = service.updateGuidelinesDocument(userId, documentId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/guidelines/{documentId}/publish")
    public ResponseEntity<GuidelinesDocumentResponse> publishGuidelinesDocument(
            @PathVariable UUID documentId,
            @RequestHeader("X-User-Id") UUID userId) {
        GuidelinesDocumentResponse response = service.publishGuidelinesDocument(userId, documentId);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/guidelines/{documentId}")
    public ResponseEntity<Void> deleteGuidelinesDocument(
            @PathVariable UUID documentId,
            @RequestHeader("X-User-Id") UUID userId) {
        service.deleteGuidelinesDocument(userId, documentId);
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping("/admin/guidelines/{documentId}")
    public ResponseEntity<Void> deleteGuidelinesDocumentAsAdmin(
            @PathVariable UUID documentId) {
        service.deleteGuidelinesDocumentAsAdmin(documentId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/guidelines")
    public ResponseEntity<PageResponse<GuidelinesDocumentResponse>> listGuidelinesDocuments(
            @RequestParam(required = false) UUID reporterId,
            @RequestParam(defaultValue = "false") boolean isPublic,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<GuidelinesDocumentResponse> response = service.listGuidelinesDocuments(reporterId, isPublic, page, size);
        return ResponseEntity.ok(response);
    }
}
