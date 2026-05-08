package project.tracknest.criminalreports.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import project.tracknest.criminalreports.configuration.objectstorage.ObjectStorage;
import project.tracknest.criminalreports.configuration.security.SecurityUtils;
import project.tracknest.criminalreports.core.datatype.PageResponse;
import project.tracknest.criminalreports.domain.reportmanager.ReportManagerService;
import project.tracknest.criminalreports.domain.reportmanager.dto.*;
import project.tracknest.criminalreports.domain.reportmanager.dto.CrimeReportResponse;
import project.tracknest.criminalreports.domain.reportmanager.dto.GuidelinesDocumentResponse;
import project.tracknest.criminalreports.domain.reportmanager.dto.MissingPersonReportResponse;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/report-manager")
@RequiredArgsConstructor
@Slf4j
public class ReportManagerController {
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/png", "image/jpeg", "image/gif", "image/webp"
    );

    private final ReportManagerService service;
    private final ObjectStorage objectStorage;

    @Value("${app.minio.buckets.criminal-reports:criminal-reports}")
    private String bucketName;

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

    @GetMapping("/missing-person-reports/{reportId}/photo")
    public ResponseEntity<byte[]> getMissingPersonReportPhoto(@PathVariable UUID reportId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        MissingPersonReportResponse report = service.getMissingPersonReport(userId, reportId);
        String photo = report.getPhoto();
        if (photo == null || photo.isBlank()) {
            return ResponseEntity.notFound().build();
        }
        try (InputStream stream = objectStorage.downloadFile(bucketName, photo)) {
            byte[] bytes = stream.readAllBytes();
            return ResponseEntity.ok()
                    .header("Content-Type", resolveContentType(photo))
                    .header("Cache-Control", "public, max-age=86400")
                    .body(bytes);
        } catch (Exception e) {
            log.error("Failed to serve photo for report {}: {}", reportId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
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

    @PostMapping(value = "/crime-reports", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CrimeReportResponse> createCrimeReport(
            @RequestParam String title,
            @RequestParam(required = false) String content,
            @RequestParam int severity,
            @RequestParam LocalDate date,
            @RequestParam double longitude,
            @RequestParam double latitude,
            @RequestParam(defaultValue = "0") int numberOfVictims,
            @RequestParam(defaultValue = "0") int numberOfOffenders,
            @RequestParam(defaultValue = "false") boolean arrested,
            @RequestParam(required = false) List<MultipartFile> photos) {

        UUID userId = SecurityUtils.getCurrentUserId();

        List<String> photoObjectNames = new ArrayList<>();
        if (photos != null) {
            for (MultipartFile photo : photos) {
                if (photo.isEmpty()) continue;
                String contentType = photo.getContentType();
                if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
                    log.warn("Rejected photo upload with content-type: {}", contentType);
                    return ResponseEntity.badRequest().build();
                }
                String originalFilename = photo.getOriginalFilename();
                String extension = "";
                if (originalFilename != null && originalFilename.contains(".")) {
                    extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                }
                String objectName = UUID.randomUUID() + extension;
                try {
                    objectStorage.uploadFile(bucketName, objectName, contentType, photo.getInputStream());
                    photoObjectNames.add(objectName);
                } catch (IOException e) {
                    log.error("Failed to upload crime report photo: {}", e.getMessage(), e);
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
                }
            }
        }

        CreateCrimeReportRequest request = CreateCrimeReportRequest.builder()
                .title(title)
                .content(content)
                .severity(severity)
                .date(date)
                .longitude(longitude)
                .latitude(latitude)
                .numberOfVictims(numberOfVictims)
                .numberOfOffenders(numberOfOffenders)
                .arrested(arrested)
                .photos(photoObjectNames)
                .build();

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
            @RequestParam(required = false) Integer maxSeverity,
            @RequestParam(required = false) String title,
            @RequestParam(defaultValue = "false") boolean isPublic,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(service.listCrimeReports(reporterId, minSeverity, maxSeverity, title, isPublic, page, Math.min(size, 100)));
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
            @RequestParam(required = false) Boolean isPublic,
            @RequestParam(required = false) String title,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(service.listGuidelinesDocuments(reporterId, isPublic, title, page, Math.min(size, 100)));
    }

    private String resolveContentType(String objectName) {
        String lower = objectName.toLowerCase();
        if (lower.endsWith(".png"))  return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".gif"))  return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        return "application/octet-stream";
    }
}
