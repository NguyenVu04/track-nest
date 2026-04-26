package project.tracknest.criminalreports.domain.criminalanalyzer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {

    private CrimeStats crimeStats;
    private MissingPersonStats missingPersonStats;
    private GuidelineStats guidelineStats;
    private ReporterStats reporterStats;

    private List<NameValue> crimeByType;
    private List<DailyTrend> weeklyTrend;
    private List<NameValue> severityGroups;
    private List<NameValue> statusGroups;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CrimeStats {
        private long total;
        private long active;        // public=true, arrested=false
        private long investigating; // public=false, arrested=false
        private long resolved;      // arrested=true
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MissingPersonStats {
        private long total;
        private long pending;
        private long published;
        private long rejected;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class GuidelineStats {
        private long total;
        private long thisMonth;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ReporterStats {
        private long totalReporters;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DailyTrend {
        private String date;
        private String dayName;
        private long crimes;
        private long missing;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class NameValue {
        private String name;
        private long value;
    }
}
