package project.tracknest.criminalreports.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import project.tracknest.criminalreports.configuration.objectstorage.ObjectStorage;
import project.tracknest.criminalreports.configuration.security.SecurityUtils;
import project.tracknest.criminalreports.core.datatype.PageResponse;
import project.tracknest.criminalreports.domain.crimereportrequestreceiver.CrimeReportRequestReceiverService;
import project.tracknest.criminalreports.domain.missingpersonrequestreceiver.MissingPersonRequestReceiverService;
import project.tracknest.criminalreports.domain.reportmanager.dto.CrimeReportResponse;
import project.tracknest.criminalreports.domain.reportmanager.dto.GuidelinesDocumentResponse;
import project.tracknest.criminalreports.domain.reportmanager.dto.MissingPersonReportResponse;
import project.tracknest.criminalreports.domain.reportviewer.ReportViewerService;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/report-user")
@RequiredArgsConstructor
@Slf4j
public class ReportUserController {

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/png", "image/jpeg", "image/gif", "image/webp"
    );

    private final ReportViewerService reportViewerService;
    private final CrimeReportRequestReceiverService crimeReportService;
    private final MissingPersonRequestReceiverService missingPersonService;
    private final ObjectStorage objectStorage;

    @Value("${app.minio.buckets.criminal-reports:criminal-reports}")
    private String bucketName;

    // ── GET list endpoints ────────────────────────────────────────────────────

    @GetMapping("/crime-reports")
    public ResponseEntity<PageResponse<CrimeReportResponse>> listCrimeReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reportViewerService.listCrimeReports(true, page, Math.min(size, 100)));
    }

    @GetMapping("/crime-reports/{reportId}")
    public ResponseEntity<CrimeReportResponse> getCrimeReport(@PathVariable UUID reportId) {
        return ResponseEntity.ok(reportViewerService.viewCrimeReport(reportId));
    }

    @GetMapping("/missing-person-reports")
    public ResponseEntity<PageResponse<MissingPersonReportResponse>> listMissingPersonReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reportViewerService.listMissingPersonReports(true, page, Math.min(size, 100)));
    }

    @GetMapping("/missing-person-reports/{reportId}")
    public ResponseEntity<MissingPersonReportResponse> getMissingPersonReport(@PathVariable UUID reportId) {
        return ResponseEntity.ok(reportViewerService.viewMissingPersonReport(reportId));
    }

    @GetMapping("/guidelines")
    public ResponseEntity<PageResponse<GuidelinesDocumentResponse>> listGuidelinesDocuments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reportViewerService.listGuidelinesDocuments(true, page, Math.min(size, 100)));
    }

    @GetMapping("/guidelines/{documentId}")
    public ResponseEntity<GuidelinesDocumentResponse> getGuidelinesDocument(@PathVariable UUID documentId) {
        return ResponseEntity.ok(reportViewerService.viewGuidelinesDocument(documentId));
    }

    // ── POST submit endpoints ─────────────────────────────────────────────────

    @PostMapping("/crime-reports")
    public ResponseEntity<CrimeReportResponse> submitCrimeReport(
            @RequestParam String title,
            @RequestParam(required = false) String content,
            @RequestParam int severity,
            @RequestParam LocalDate date,
            @RequestParam double longitude,
            @RequestParam double latitude,
            @RequestParam(defaultValue = "0") int numberOfVictims,
            @RequestParam(defaultValue = "0") int numberOfOffenders,
            @RequestParam(defaultValue = "false") boolean arrested,
            @RequestParam(value = "photos", required = false) List<MultipartFile> photos) {

        String contentObjectName = null;
        if (content != null && !content.isBlank()) {
            try {
                String htmlContent = "<!doctype html><html><head><meta charset=\"utf-8\"/></head><body>"
                        + content + "</body></html>";
                contentObjectName = UUID.randomUUID() + ".html";
                objectStorage.uploadFile(
                        bucketName,
                        contentObjectName,
                        "text/html; charset=UTF-8",
                        new ByteArrayInputStream(htmlContent.getBytes(StandardCharsets.UTF_8))
                );
            } catch (Exception e) {
                log.error("Failed to upload content HTML: {}", e.getMessage(), e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }

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
                String extension = (originalFilename != null && originalFilename.contains("."))
                        ? originalFilename.substring(originalFilename.lastIndexOf("."))
                        : "";
                String objectName = UUID.randomUUID() + extension;
                try {
                    objectStorage.uploadFile(bucketName, objectName, contentType, photo.getInputStream());
                    photoObjectNames.add(objectName);
                } catch (IOException e) {
                    log.error("Failed to upload photo: {}", e.getMessage(), e);
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
                }
            }
        }

        UUID userId = SecurityUtils.getCurrentUserId();
        CrimeReportResponse response = crimeReportService.submitCrimeReport(
                userId, title, contentObjectName, severity, date,
                longitude, latitude, numberOfVictims, numberOfOffenders, arrested, photoObjectNames);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/missing-person-reports")
    public ResponseEntity<MissingPersonReportResponse> submitMissingPersonReport(
            @RequestParam String title,
            @RequestParam String fullName,
            @RequestParam String personalId,
            @RequestParam String content,
            @RequestParam(required = false) MultipartFile photo,
            @RequestParam String contactEmail,
            @RequestParam String contactPhone,
            @RequestParam LocalDate date,
            @RequestParam double latitude,
            @RequestParam double longitude) {

        String contentObjectName = null;
        try {
            String htmlBody = content == null ? "" : content;
            String htmlContent = "<!doctype html><html><head><meta charset=\"utf-8\"/></head><body>"
                    + htmlBody + "</body></html>";
            contentObjectName = UUID.randomUUID() + ".html";
            objectStorage.uploadFile(
                    bucketName,
                    contentObjectName,
                    "text/html; charset=UTF-8",
                    new ByteArrayInputStream(htmlContent.getBytes(StandardCharsets.UTF_8))
            );
        } catch (Exception e) {
            log.error("Failed to upload content HTML: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }

        String photoObjectName = null;
        if (photo != null && !photo.isEmpty()) {
            String contentType = photo.getContentType();
            if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
                log.warn("Rejected photo upload with content-type: {}", contentType);
                return ResponseEntity.badRequest().build();
            }
            String originalFilename = photo.getOriginalFilename();
            String extension = (originalFilename != null && originalFilename.contains("."))
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : "";
            photoObjectName = UUID.randomUUID() + extension;
            try {
                objectStorage.uploadFile(bucketName, photoObjectName, contentType, photo.getInputStream());
            } catch (IOException e) {
                log.error("Failed to upload photo: {}", e.getMessage(), e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }

        UUID userId = SecurityUtils.getCurrentUserId();
        MissingPersonReportResponse response = missingPersonService.submitMissingPersonReport(
                userId, title, fullName, personalId,
                contentObjectName, photoObjectName,
                contactEmail, contactPhone, date, latitude, longitude);
        return ResponseEntity.ok(response);
    }
}
