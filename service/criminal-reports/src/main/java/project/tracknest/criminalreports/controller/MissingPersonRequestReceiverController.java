package project.tracknest.criminalreports.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.tracknest.criminalreports.domain.missingpersonrequestreceiver.MissingPersonRequestReceiverService;
import project.tracknest.criminalreports.domain.reportmanager.dto.MissingPersonReportResponse;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/missing-person-request-receiver")
@RequiredArgsConstructor
public class MissingPersonRequestReceiverController {
    private final MissingPersonRequestReceiverService service;

    @PostMapping("/submit")
    public ResponseEntity<MissingPersonReportResponse> submitMissingPersonReport(
            @RequestParam UUID userId,
            @RequestParam UUID reporterId,
            @RequestParam String title,
            @RequestParam String fullName,
            @RequestParam String personalId,
            @RequestParam(required = false) String photo,
            @RequestParam(required = false) String contactEmail,
            @RequestParam String contactPhone,
            @RequestParam LocalDate date,
            @RequestParam String content) {
        MissingPersonReportResponse response = service.submitMissingPersonReport(
                userId, reporterId, title, fullName, personalId, photo, 
                contactEmail, contactPhone, date, content);
        return ResponseEntity.ok(response);
    }
}
