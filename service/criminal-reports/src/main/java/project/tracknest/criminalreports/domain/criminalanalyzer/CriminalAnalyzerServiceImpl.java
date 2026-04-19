package project.tracknest.criminalreports.domain.criminalanalyzer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.criminalreports.domain.criminalanalyzer.dto.CrimeAnalysisReportResponse;
import project.tracknest.criminalreports.domain.criminalanalyzer.dto.DashboardSummaryResponse;
import project.tracknest.criminalreports.domain.repository.CrimeReportRepository;
import project.tracknest.criminalreports.domain.repository.GuidelinesDocumentRepository;
import project.tracknest.criminalreports.domain.repository.MissingPersonReportRepository;
import project.tracknest.criminalreports.domain.repository.ReporterRepository;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
class CriminalAnalyzerServiceImpl implements CriminalAnalyzerService {

    private final CrimeReportRepository crimeReportRepository;
    private final MissingPersonReportRepository missingPersonReportRepository;
    private final GuidelinesDocumentRepository guidelinesDocumentRepository;
    private final ReporterRepository reporterRepository;

    @Override
    @Transactional(readOnly = true)
    public CrimeAnalysisReportResponse generateCrimeAnalysisReport(LocalDate startDate, LocalDate endDate) {
        log.info("Generating crime analysis report from {} to {}", startDate, endDate);

        List<project.tracknest.criminalreports.core.entity.CrimeReport> crimeReports =
                crimeReportRepository.findByDateBetween(startDate, endDate);

        OffsetDateTime startDateTime = startDate.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime endDateTime = endDate.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
        List<project.tracknest.criminalreports.core.entity.MissingPersonReport> missingPersonReports =
                missingPersonReportRepository.findByCreatedAtBetween(startDateTime, endDateTime);

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

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary() {
        // ── Crime stats ──────────────────────────────────────────────────────
        long totalCrimes       = crimeReportRepository.count();
        long activeCrimes      = crimeReportRepository.countActive();
        long investigatingCrimes = crimeReportRepository.countInvestigating();
        long resolvedCrimes    = crimeReportRepository.countResolved();

        // ── Missing person stats ─────────────────────────────────────────────
        long totalMissing    = missingPersonReportRepository.count();
        long pendingMissing  = missingPersonReportRepository.countByStatus("PENDING");
        long publishedMissing = missingPersonReportRepository.countByStatus("PUBLISHED");
        long rejectedMissing = missingPersonReportRepository.countByStatus("REJECTED");

        // ── Guideline stats ──────────────────────────────────────────────────
        long totalGuidelines  = guidelinesDocumentRepository.count();
        OffsetDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay().atOffset(ZoneOffset.UTC);
        long guidelinesThisMonth = guidelinesDocumentRepository.countCreatedSince(startOfMonth);

        // ── Reporter stats ───────────────────────────────────────────────────
        long totalReporters = reporterRepository.count();

        // ── Weekly trend (last 7 days) ───────────────────────────────────────
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(6);
        OffsetDateTime weekStartDt = weekStart.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime weekEndDt   = today.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);

        List<project.tracknest.criminalreports.core.entity.CrimeReport> weekCrimes =
                crimeReportRepository.findByCreatedAtBetween(weekStartDt, weekEndDt);
        List<project.tracknest.criminalreports.core.entity.MissingPersonReport> weekMissing =
                missingPersonReportRepository.findByCreatedAtBetween(weekStartDt, weekEndDt);

        Map<LocalDate, long[]> trendMap = new java.util.LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            trendMap.put(today.minusDays(i), new long[]{0, 0});
        }
        for (var r : weekCrimes) {
            LocalDate d = r.getCreatedAt().toLocalDate();
            if (trendMap.containsKey(d)) trendMap.get(d)[0]++;
        }
        for (var r : weekMissing) {
            LocalDate d = r.getCreatedAt().toLocalDate();
            if (trendMap.containsKey(d)) trendMap.get(d)[1]++;
        }

        List<DashboardSummaryResponse.DailyTrend> weeklyTrend = new ArrayList<>();
        for (var entry : trendMap.entrySet()) {
            LocalDate date = entry.getKey();
            String dayName = date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            weeklyTrend.add(DashboardSummaryResponse.DailyTrend.builder()
                    .date(date.toString())
                    .dayName(dayName)
                    .crimes(entry.getValue()[0])
                    .missing(entry.getValue()[1])
                    .build());
        }

        // ── Crime by type ────────────────────────────────────────────────────
        List<project.tracknest.criminalreports.core.entity.CrimeReport> allCrimes =
                crimeReportRepository.findAll();
        Map<String, Long> typeMap = new HashMap<>();
        for (var r : allCrimes) {
            String type = extractCrimeType(r.getTitle());
            typeMap.merge(type, 1L, Long::sum);
        }
        List<DashboardSummaryResponse.NameValue> crimeByType = typeMap.entrySet().stream()
                .map(e -> DashboardSummaryResponse.NameValue.builder().name(e.getKey()).value(e.getValue()).build())
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .toList();

        // ── Severity groups ──────────────────────────────────────────────────
        long sevLow  = allCrimes.stream().filter(r -> r.getSeverity() <= 2).count();
        long sevMed  = allCrimes.stream().filter(r -> r.getSeverity() == 3).count();
        long sevHigh = allCrimes.stream().filter(r -> r.getSeverity() >= 4).count();
        List<DashboardSummaryResponse.NameValue> severityGroups = List.of(
                DashboardSummaryResponse.NameValue.builder().name("Low").value(sevLow).build(),
                DashboardSummaryResponse.NameValue.builder().name("Medium").value(sevMed).build(),
                DashboardSummaryResponse.NameValue.builder().name("High").value(sevHigh).build()
        );

        // ── Status groups ────────────────────────────────────────────────────
        List<DashboardSummaryResponse.NameValue> statusGroups = List.of(
                DashboardSummaryResponse.NameValue.builder().name("Active").value(activeCrimes).build(),
                DashboardSummaryResponse.NameValue.builder().name("Investigating").value(investigatingCrimes).build(),
                DashboardSummaryResponse.NameValue.builder().name("Resolved").value(resolvedCrimes).build()
        );

        return DashboardSummaryResponse.builder()
                .crimeStats(DashboardSummaryResponse.CrimeStats.builder()
                        .total(totalCrimes)
                        .active(activeCrimes)
                        .investigating(investigatingCrimes)
                        .resolved(resolvedCrimes)
                        .build())
                .missingPersonStats(DashboardSummaryResponse.MissingPersonStats.builder()
                        .total(totalMissing)
                        .pending(pendingMissing)
                        .published(publishedMissing)
                        .rejected(rejectedMissing)
                        .build())
                .guidelineStats(DashboardSummaryResponse.GuidelineStats.builder()
                        .total(totalGuidelines)
                        .thisMonth(guidelinesThisMonth)
                        .build())
                .reporterStats(DashboardSummaryResponse.ReporterStats.builder()
                        .totalReporters(totalReporters)
                        .build())
                .crimeByType(crimeByType)
                .weeklyTrend(weeklyTrend)
                .severityGroups(severityGroups)
                .statusGroups(statusGroups)
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

        // Track running totals (severitySum, count) per location key
        Map<String, long[]> totals = new HashMap<>();
        Map<String, double[]> coords = new HashMap<>();

        for (var report : reports) {
            String key = String.format("%.3f,%.3f", report.getLongitude(), report.getLatitude());
            totals.merge(key, new long[]{report.getSeverity(), 1},
                    (existing, inc) -> new long[]{existing[0] + inc[0], existing[1] + inc[1]});
            coords.putIfAbsent(key, new double[]{report.getLongitude(), report.getLatitude()});
        }

        return totals.entrySet().stream()
                .map(e -> {
                    long[] sums = e.getValue();
                    double[] xy = coords.get(e.getKey());
                    return CrimeAnalysisReportResponse.HotspotArea.builder()
                            .longitude(xy[0])
                            .latitude(xy[1])
                            .incidentCount(sums[1])
                            .averageSeverity((double) sums[0] / sums[1])
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getIncidentCount(), a.getIncidentCount()))
                .limit(10)
                .toList();
    }
}
