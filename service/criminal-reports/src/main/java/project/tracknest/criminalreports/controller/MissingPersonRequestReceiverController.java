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
import project.tracknest.criminalreports.domain.missingpersonrequestreceiver.MissingPersonRequestReceiverService;
import project.tracknest.criminalreports.domain.reportmanager.dto.MissingPersonReportResponse;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/missing-person-request-receiver")
@RequiredArgsConstructor
@Slf4j
public class MissingPersonRequestReceiverController {

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/png", "image/jpeg", "image/gif", "image/webp"
    );

    private final MissingPersonRequestReceiverService service;
    private final ObjectStorage objectStorage;

    @Value("${app.minio.buckets.criminal-reports:criminal-reports}")
    private String bucketName;

    @PostMapping("/submit")
    public ResponseEntity<MissingPersonReportResponse> submitMissingPersonReport(
//            @RequestParam UUID reporterId, //TODO!: using roundrobin as a temporary method, optimize if necessary
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

        String photoObjectName = null;
        if (photo != null && !photo.isEmpty()) {
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
            photoObjectName = UUID.randomUUID() + extension;
            try {
                objectStorage.uploadFile(bucketName, photoObjectName, contentType, photo.getInputStream());
            } catch (IOException e) {
                log.error("Failed to upload photo: {}", e.getMessage(), e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }

        UUID userId = SecurityUtils.getCurrentUserId();
        MissingPersonReportResponse response = service.submitMissingPersonReport(
                userId,
                title,
                fullName,
                personalId,
                content,
                photoObjectName,
                contactEmail,
                contactPhone,
                date,
                latitude,
                longitude);
        return ResponseEntity.ok(response);
    }
}
