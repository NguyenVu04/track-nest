package project.tracknest.criminalreports.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.tracknest.criminalreports.domain.criminalanalyzer.CriminalAnalyzerService;
import project.tracknest.criminalreports.domain.criminalanalyzer.dto.CrimeAnalysisReportResponse;
import project.tracknest.criminalreports.domain.criminalanalyzer.dto.DashboardSummaryResponse;

import java.time.LocalDate;

@RestController
@RequestMapping("/criminal-analyzer")
@RequiredArgsConstructor
public class CriminalAnalyzerController {
    private final CriminalAnalyzerService service;

    @GetMapping("/crime-analysis")
    public ResponseEntity<CrimeAnalysisReportResponse> generateCrimeAnalysisReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        CrimeAnalysisReportResponse response = service.generateCrimeAnalysisReport(startDate, endDate);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardSummaryResponse> getDashboardSummary() {
        return ResponseEntity.ok(service.getDashboardSummary());
    }
}
