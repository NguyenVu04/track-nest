package project.tracknest.criminalreports.domain.criminalanalyzer;

import project.tracknest.criminalreports.domain.criminalanalyzer.dto.CrimeAnalysisReportResponse;

import java.time.LocalDate;

public interface CriminalAnalyzerService {
    CrimeAnalysisReportResponse generateCrimeAnalysisReport(LocalDate startDate, LocalDate endDate);
}
