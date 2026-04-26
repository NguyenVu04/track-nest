package project.tracknest.criminalreports.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import project.tracknest.criminalreports.configuration.objectstorage.ObjectStorage;
import project.tracknest.criminalreports.controller.dto.FileUploadResponse;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/file")
@RequiredArgsConstructor
@Slf4j
public class FileController {

    private static final Set<String> ALLOWED_UPLOAD_TYPES = Set.of(
            "image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf"
    );

    private final ObjectStorage objectStorage;

    @Value("${app.minio.buckets.criminal-reports:criminal-reports}")
    private String bucketName;

    @Value("${app.minio.public-url:http://localhost:9000}")
    private String publicUrl;

    /**
     * Upload an image or PDF. HTML/JS are rejected — use POST /file/document/{id} for TinyMCE content.
     */
    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file) {

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_UPLOAD_TYPES.contains(contentType)) {
            log.warn("Rejected upload with content-type: {}", contentType);
            return ResponseEntity.badRequest().build();
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String objectName = UUID.randomUUID() + extension;

        log.info("Uploading file: {} -> {}", originalFilename, objectName);
        try {
            objectStorage.uploadFile(bucketName, objectName, contentType, file.getInputStream());
            String fileUrl = publicUrl + "/" + bucketName + "/" + objectName;
            return ResponseEntity.ok(new FileUploadResponse(objectName, fileUrl, contentType, file.getSize()));
        } catch (IOException e) {
            log.error("Failed to upload file: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Upload a file scoped to a document. HTML is stored as {documentId}/index.html; others use
     * the sanitised basename. Used by TinyMCE to push the edited document back to storage.
     */
    @PostMapping("/document/{documentId}")
    public ResponseEntity<FileUploadResponse> uploadDocumentFile(
            @PathVariable UUID documentId,
            @RequestParam("file") MultipartFile file) {

        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();

        String objectName;
        if (contentType != null && contentType.contains("html")) {
            objectName = documentId + "/index.html";
        } else {
            String safeName = sanitizeFilename(originalFilename);
            if (safeName == null) {
                return ResponseEntity.badRequest().build();
            }
            objectName = documentId + "/" + safeName;
        }

        log.info("Uploading document file: {} -> {}", originalFilename, objectName);
        try {
            objectStorage.uploadFile(bucketName, objectName, contentType, file.getInputStream());
            String fileUrl = publicUrl + "/" + bucketName + "/" + objectName;
            return ResponseEntity.ok(new FileUploadResponse(objectName, fileUrl, contentType, file.getSize()));
        } catch (IOException e) {
            log.error("Failed to upload document file: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete all files under a document folder ({documentId}/).
     */
    @DeleteMapping("/document/{documentId}")
    public ResponseEntity<Void> deleteDocumentFolder(@PathVariable UUID documentId) {
        log.info("Deleting document folder: {}/", documentId);
        try {
            objectStorage.deleteFolder(bucketName, documentId + "/");
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Failed to delete document folder: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete a file. The filename may include a folder prefix, e.g. "{documentId}/image.png".
     */
    @DeleteMapping("/**")
    public ResponseEntity<Void> deleteFile(HttpServletRequest request) {
        String filename = extractFilename(request);
        if (!isValidFilename(filename)) {
            return ResponseEntity.badRequest().build();
        }
        log.info("Deleting file: {}/{}", bucketName, filename);
        try {
            objectStorage.deleteFile(bucketName, filename);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Failed to delete file: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Proxy a file from storage — keeps MinIO private.
     * Supports paths like "{documentId}/index.html" or "{uuid}.png".
     */
    @GetMapping("/**")
    public ResponseEntity<byte[]> serveFile(HttpServletRequest request) {
        String filename = extractFilename(request);
        if (!isValidFilename(filename)) {
            return ResponseEntity.badRequest().build();
        }
        try (InputStream stream = objectStorage.downloadFile(bucketName, filename)) {
            byte[] bytes = stream.readAllBytes();
            String contentType = resolveContentType(filename);
            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .header("Cache-Control", "public, max-age=86400")
                    .body(bytes);
        } catch (Exception e) {
            log.error("Failed to serve file {}/{}: {}", bucketName, filename, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private String extractFilename(HttpServletRequest request) {
        String requestURI = request.getRequestURI();
        String contextPath = request.getContextPath();
        // Strip context path and servlet path prefix; normalise
        String path = requestURI.substring(contextPath.length());
        // path is e.g. /file/uuid/photo.png — strip /file/ prefix
        String prefix = "/file/";
        int idx = path.indexOf(prefix);
        if (idx < 0) return "";
        return path.substring(idx + prefix.length());
    }

    private boolean isValidFilename(String filename) {
        if (filename == null || filename.isBlank()) return false;
        Path normalized = Paths.get(filename).normalize();
        String normalStr = normalized.toString().replace('\\', '/');
        return !normalStr.startsWith("..") && !normalStr.contains("/../");
    }

    private String sanitizeFilename(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) return UUID.randomUUID().toString();
        String basename = Paths.get(originalFilename).getFileName().toString();
        if (basename.contains("..") || basename.contains("/") || basename.contains("\\")) return null;
        return basename;
    }

    private String resolveContentType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png"))                         return MediaType.IMAGE_PNG_VALUE;
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return MediaType.IMAGE_JPEG_VALUE;
        if (lower.endsWith(".gif"))                         return MediaType.IMAGE_GIF_VALUE;
        if (lower.endsWith(".webp"))                        return "image/webp";
        if (lower.endsWith(".pdf"))                         return MediaType.APPLICATION_PDF_VALUE;
        if (lower.endsWith(".html") || lower.endsWith(".htm")) return MediaType.TEXT_HTML_VALUE;
        return MediaType.APPLICATION_OCTET_STREAM_VALUE;
    }
}
