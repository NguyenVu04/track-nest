package project.tracknest.criminalreports.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.tracknest.criminalreports.configuration.objectstorage.ObjectStorage;
import project.tracknest.criminalreports.core.datatype.PageResponse;
import project.tracknest.criminalreports.domain.reportmanager.dto.CrimeReportResponse;
import project.tracknest.criminalreports.domain.reportmanager.dto.GuidelinesDocumentResponse;
import project.tracknest.criminalreports.domain.reportmanager.dto.MissingPersonReportResponse;
import project.tracknest.criminalreports.domain.reportviewer.ReportViewerService;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/report-viewer")
@RequiredArgsConstructor
@Slf4j
public class ReportViewerController {
    private final ReportViewerService service;
    private final ObjectStorage objectStorage;

    @Value("${app.minio.buckets.criminal-reports:criminal-reports}")
    private String bucketName;

    @GetMapping("/missing-person-reports/{reportId}")
    public ResponseEntity<MissingPersonReportResponse> viewMissingPersonReport(
            @PathVariable UUID reportId) {
        MissingPersonReportResponse response = service.viewMissingPersonReport(reportId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/missing-person-reports/{reportId}/photo")
    public ResponseEntity<byte[]> viewMissingPersonReportPhoto(@PathVariable UUID reportId) {
        MissingPersonReportResponse report = service.viewMissingPersonReport(reportId);
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

    @GetMapping("/crime-reports/{reportId}/photos/{objectName}")
    public ResponseEntity<byte[]> viewCrimeReportPhoto(
            @PathVariable UUID reportId,
            @PathVariable String objectName) {
        CrimeReportResponse report = service.viewCrimeReport(reportId);
        List<String> photos = report.getPhotos();
        if (photos == null || !photos.contains(objectName)) {
            return ResponseEntity.notFound().build();
        }
        try (InputStream stream = objectStorage.downloadFile(bucketName, objectName)) {
            byte[] bytes = stream.readAllBytes();
            return ResponseEntity.ok()
                    .header("Content-Type", resolveContentType(objectName))
                    .header("Cache-Control", "public, max-age=86400")
                    .body(bytes);
        } catch (Exception e) {
            log.error("Failed to serve photo {} for report {}: {}", objectName, reportId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
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

    private String resolveContentType(String objectName) {
        String lower = objectName.toLowerCase();
        if (lower.endsWith(".png"))  return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".gif"))  return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        return "application/octet-stream";
    }
}
