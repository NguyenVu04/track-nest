package project.tracknest.criminalreports.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.tracknest.criminalreports.domain.reportadmin.ReportAdminService;

import java.util.UUID;

@RestController
@RequestMapping("/report-admin")
@RequiredArgsConstructor
public class ReportAdminController {
    private final ReportAdminService service;

    @DeleteMapping("/missing-person-reports/{reportId}")
    public ResponseEntity<Void> deleteMissingPersonReportAsAdmin(
            @PathVariable UUID reportId) {
        service.deleteMissingPersonReportAsAdmin(reportId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/crime-reports/{reportId}")
    public ResponseEntity<Void> deleteCrimeReportAsAdmin(
            @PathVariable UUID reportId) {
        service.deleteCrimeReportAsAdmin(reportId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/guidelines/{documentId}")
    public ResponseEntity<Void> deleteGuidelinesDocumentAsAdmin(
            @PathVariable UUID documentId) {
        service.deleteGuidelinesDocumentAsAdmin(documentId);
        return ResponseEntity.noContent().build();
    }
}
