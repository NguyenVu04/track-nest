package project.tracknest.criminalreports.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import project.tracknest.criminalreports.configuration.objectstorage.ObjectStorage;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/file")
@RequiredArgsConstructor
@Slf4j
public class FileController {

    private final ObjectStorage objectStorage;

    @Value("${app.minio.public-url:http://localhost:38080/criminal-reports/file}")
    private String publicUrlPrefix;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "bucket", defaultValue = "criminal-reports") String bucket) {
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            
            String objectName = UUID.randomUUID() + extension;
            String contentType = file.getContentType();
            
            objectStorage.uploadFile(bucket, objectName, contentType, file.getInputStream());
            
            Map<String, Object> response = new HashMap<>();
            response.put("objectName", objectName);
            response.put("publicUrl", publicUrlPrefix + "/" + bucket + "/" + objectName);
            response.put("contentType", contentType);
            response.put("size", file.getSize());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to upload file to bucket {}", bucket, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{bucket}/{filename}")
    public ResponseEntity<Void> deleteFile(
            @PathVariable String bucket,
            @PathVariable String filename) {
        try {
            objectStorage.deleteFile(bucket, filename);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Failed to delete file {} from bucket {}", filename, bucket, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{bucket}/{filename}")
    public ResponseEntity<byte[]> getFile(
            @PathVariable String bucket,
            @PathVariable String filename) {
        try {
            if (!objectStorage.fileExists(bucket, filename)) {
                return ResponseEntity.notFound().build();
            }

            try (InputStream stream = objectStorage.downloadFile(bucket, filename)) {
                byte[] bytes = stream.readAllBytes();
                return ResponseEntity.ok()
                        .header("Content-Type", resolveContentType(filename))
                        .header("Cache-Control", "public, max-age=86400")
                        .body(bytes);
            }
        } catch (Exception e) {
            log.error("Failed to serve file {} from bucket {}: {}", filename, bucket, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    private String resolveContentType(String objectName) {
        String lower = objectName.toLowerCase();
        if (lower.endsWith(".png"))  return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".gif"))  return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".html")) return "text/html; charset=UTF-8";
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".txt")) return "text/plain";
        return "application/octet-stream";
    }
}
