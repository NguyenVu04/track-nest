package project.tracknest.criminalreports.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.tracknest.criminalreports.core.datatype.PageResponse;
import project.tracknest.criminalreports.domain.crimelocator.CrimeLocatorService;
import project.tracknest.criminalreports.domain.reportmanager.dto.CrimeReportResponse;

@RestController
@RequestMapping("/crime-locator")
@RequiredArgsConstructor
@Slf4j
public class CrimeLocatorController {
    private final CrimeLocatorService service;

    @GetMapping("/heatmap")
    public ResponseEntity<PageResponse<CrimeReportResponse>> viewCrimeHeatmap(
            @RequestParam double longitude,
            @RequestParam double latitude,
            @RequestParam(defaultValue = "5000") double radius,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResponse<CrimeReportResponse> response = service.viewCrimeHeatmap(longitude, latitude, radius, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/high-risk-check")
    public ResponseEntity<Boolean> checkIfInsideHighRiskCrimeZone(
            @RequestParam double longitude,
            @RequestParam double latitude) {
        boolean isHighRisk = service.checkIfInsideHighRiskCrimeZone(longitude, latitude);
        return ResponseEntity.ok(isHighRisk);
    }
}
