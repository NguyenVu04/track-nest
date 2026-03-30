package project.tracknest.criminalreports.domain.criminalanalyzer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrimeAnalysisReportResponse {
    private LocalDate reportDate;
    private int totalCrimeReports;
    private int totalMissingPersonReports;
    private Map<Integer, Long> crimesBySeverity;
    private Map<String, Long> crimesByType;
    private long totalArrests;
    private int totalVictims;
    private int totalOffenders;
    private List<CrimeTrendPoint> crimeTrend;
    private List<HotspotArea> hotspots;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CrimeTrendPoint {
        private LocalDate date;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HotspotArea {
        private double longitude;
        private double latitude;
        private long incidentCount;
        private int averageSeverity;
    }
}
