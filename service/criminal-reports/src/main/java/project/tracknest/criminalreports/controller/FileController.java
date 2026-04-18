package project.tracknest.criminalreports.controller;

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
import java.util.UUID;

@RestController
@RequestMapping("/file")
@RequiredArgsConstructor
@Slf4j
public class FileController {

    private final ObjectStorage objectStorage;

    @Value("${app.minio.buckets.criminal-reports:criminal-reports}")
    private String bucketName;

    @Value("${app.minio.public-url:http://localhost:9000}")
    private String publicUrl;

    /**
     * Upload a file to MinIO storage
     * POST /file/upload
     */
    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "bucket", required = false, defaultValue = "criminal-reports") String bucket,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        
        log.info("Uploading file: {} to bucket: {}", file.getOriginalFilename(), bucket);
        
        try {
            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String objectName = UUID.randomUUID().toString() + extension;
            
            // Upload to MinIO
            objectStorage.uploadFile(
                bucket,
                objectName,
                file.getContentType(),
                file.getInputStream()
            );
            
            // Build public URL
            String publicFileUrl = publicUrl + "/" + bucket + "/" + objectName;
            
            log.info("File uploaded successfully: {}", publicFileUrl);
            
            FileUploadResponse response = new FileUploadResponse(
                objectName,
                publicFileUrl,
                file.getContentType(),
                file.getSize()
            );
            
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            log.error("Failed to upload file: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Upload a file scoped to a document.
     * HTML files are stored as {documentId}/index.html; others as {documentId}/{originalFilename}.
     * POST /file/document/{documentId}
     */
    @PostMapping("/document/{documentId}")
    public ResponseEntity<FileUploadResponse> uploadDocumentFile(
            @PathVariable UUID documentId,
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {

        String originalFilename = file.getOriginalFilename();
        String contentType = file.getContentType();

        String objectName;
        if (contentType != null && contentType.contains("html")) {
            objectName = documentId + "/index.html";
        } else {
            String safeName = (originalFilename != null && !originalFilename.isBlank())
                    ? originalFilename
                    : UUID.randomUUID().toString();
            objectName = documentId + "/" + safeName;
        }

        log.info("Uploading document file: {} -> {}", originalFilename, objectName);

        try {
            objectStorage.uploadFile(bucketName, objectName, contentType, file.getInputStream());
            String publicFileUrl = publicUrl + "/" + bucketName + "/" + objectName;
            log.info("Document file uploaded: {}", publicFileUrl);
            return ResponseEntity.ok(new FileUploadResponse(objectName, publicFileUrl, contentType, file.getSize()));
        } catch (IOException e) {
            log.error("Failed to upload document file: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete all files under a document folder ({documentId}/).
     * DELETE /file/document/{documentId}
     */
    @DeleteMapping("/document/{documentId}")
    public ResponseEntity<Void> deleteDocumentFolder(
            @PathVariable UUID documentId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {

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
     * Delete a file from MinIO storage
     * DELETE /file/{bucket}/{filename}
     */
    @DeleteMapping("/{bucket}/{filename:.+}")
    public ResponseEntity<Void> deleteFile(
            @PathVariable String bucket,
            @PathVariable String filename,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {

        log.info("Deleting file: {}/{}", bucket, filename);

        try {
            objectStorage.deleteFile(bucket, filename);
            log.info("File deleted successfully: {}/{}", bucket, filename);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Failed to delete file: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get file URL for viewing
     * GET /file/{bucket}/{filename}
     */
    @GetMapping("/{bucket}/{filename:.+}")
    public ResponseEntity<String> getFileUrl(
            @PathVariable String bucket,
            @PathVariable String filename) {

        String publicFileUrl = publicUrl + "/" + bucket + "/" + filename;
        return ResponseEntity.ok(publicFileUrl);
    }
}