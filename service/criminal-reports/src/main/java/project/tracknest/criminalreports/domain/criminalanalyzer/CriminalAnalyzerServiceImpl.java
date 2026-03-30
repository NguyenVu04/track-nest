package project.tracknest.criminalreports.domain.criminalanalyzer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.criminalreports.domain.criminalanalyzer.dto.CrimeAnalysisReportResponse;
import project.tracknest.criminalreports.domain.repository.CrimeReportRepository;
import project.tracknest.criminalreports.domain.repository.MissingPersonReportRepository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
class CriminalAnalyzerServiceImpl implements CriminalAnalyzerService {

    private final CrimeReportRepository crimeReportRepository;
    private final MissingPersonReportRepository missingPersonReportRepository;

    @Override
    @Transactional(readOnly = true)
    public CrimeAnalysisReportResponse generateCrimeAnalysisReport(LocalDate startDate, LocalDate endDate) {
        log.info("Generating crime analysis report from {} to {}", startDate, endDate);

        List<project.tracknest.criminalreports.core.entity.CrimeReport> crimeReports = 
                crimeReportRepository.findAll().stream()
                        .filter(r -> !r.getDate().isBefore(startDate) && !r.getDate().isAfter(endDate))
                        .toList();

        List<project.tracknest.criminalreports.core.entity.MissingPersonReport> missingPersonReports =
                missingPersonReportRepository.findAll().stream()
                        .filter(r -> r.getCreatedAt() != null && 
                                    !r.getCreatedAt().toLocalDate().isBefore(startDate) && 
                                    !r.getCreatedAt().toLocalDate().isAfter(endDate))
                        .toList();

        Map<Integer, Long> crimesBySeverity = new HashMap<>();
        long totalArrests = 0;
        int totalVictims = 0;
        int totalOffenders = 0;

        for (var report : crimeReports) {
            crimesBySeverity.merge(report.getSeverity(), 1L, Long::sum);
            if (report.isArrested()) totalArrests++;
            totalVictims += report.getNumberOfVictims();
            totalOffenders += report.getNumberOfOffenders();
        }

        Map<String, Long> crimesByType = new HashMap<>();
        for (var report : crimeReports) {
            String type = extractCrimeType(report.getTitle());
            crimesByType.merge(type, 1L, Long::sum);
        }

        List<CrimeAnalysisReportResponse.CrimeTrendPoint> crimeTrend = generateTrend(crimeReports, startDate, endDate);
        List<CrimeAnalysisReportResponse.HotspotArea> hotspots = generateHotspots(crimeReports);

        return CrimeAnalysisReportResponse.builder()
                .reportDate(LocalDate.now())
                .totalCrimeReports(crimeReports.size())
                .totalMissingPersonReports(missingPersonReports.size())
                .crimesBySeverity(crimesBySeverity)
                .crimesByType(crimesByType)
                .totalArrests(totalArrests)
                .totalVictims(totalVictims)
                .totalOffenders(totalOffenders)
                .crimeTrend(crimeTrend)
                .hotspots(hotspots)
                .build();
    }

    private String extractCrimeType(String title) {
        if (title == null) return "Unknown";
        String lowerTitle = title.toLowerCase();
        if (lowerTitle.contains("robbery") || lowerTitle.contains("theft")) return "Theft";
        if (lowerTitle.contains("assault")) return "Assault";
        if (lowerTitle.contains("fraud")) return "Fraud";
        if (lowerTitle.contains("burglary")) return "Burglary";
        if (lowerTitle.contains("pickpocket")) return "Pickpocketing";
        return "Other";
    }

    private List<CrimeAnalysisReportResponse.CrimeTrendPoint> generateTrend(
            List<project.tracknest.criminalreports.core.entity.CrimeReport> reports,
            LocalDate startDate, LocalDate endDate) {
        
        Map<LocalDate, Long> trendMap = new HashMap<>();
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            trendMap.put(current, 0L);
            current = current.plusDays(1);
        }

        for (var report : reports) {
            LocalDate date = report.getDate();
            trendMap.merge(date, 1L, Long::sum);
        }

        List<CrimeAnalysisReportResponse.CrimeTrendPoint> trend = new ArrayList<>();
        for (var entry : trendMap.entrySet()) {
            trend.add(CrimeAnalysisReportResponse.CrimeTrendPoint.builder()
                    .date(entry.getKey())
                    .count(entry.getValue())
                    .build());
        }
        trend.sort((a, b) -> a.getDate().compareTo(b.getDate()));
        return trend;
    }

    private List<CrimeAnalysisReportResponse.HotspotArea> generateHotspots(
            List<project.tracknest.criminalreports.core.entity.CrimeReport> reports) {
        
        Map<String, CrimeAnalysisReportResponse.HotspotArea> hotspotMap = new HashMap<>();
        
        for (var report : reports) {
            String key = String.format("%.3f,%.3f", report.getLongitude(), report.getLatitude());
            hotspotMap.merge(key, 
                    CrimeAnalysisReportResponse.HotspotArea.builder()
                            .longitude(report.getLongitude())
                            .latitude(report.getLatitude())
                            .incidentCount(1L)
                            .averageSeverity(report.getSeverity())
                            .build(),
                    (existing, newEntry) -> CrimeAnalysisReportResponse.HotspotArea.builder()
                            .longitude(existing.getLongitude())
                            .latitude(existing.getLatitude())
                            .incidentCount(existing.getIncidentCount() + 1)
                            .averageSeverity((existing.getAverageSeverity() + newEntry.getAverageSeverity()) / 2)
                            .build());
        }

        return hotspotMap.values().stream()
                .sorted((a, b) -> Long.compare(b.getIncidentCount(), a.getIncidentCount()))
                .limit(10)
                .toList();
    }
}
