package project.tracknest.usertracking.domain.anomalydetector.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Slf4j
@Component
@RequiredArgsConstructor
public class CellVisitMaintenanceJob implements Job {
    private static final int RETENTION_DAYS = 28;
    private static final int MATURITY_MIN_VISITS = 5;

    private final AnomalyDetectorHandlerCellVisitRepository visitRepository;
    private final AnomalyDetectorLocationBucketRepository bucketRepository;

    @Override
    @Transactional
    public void execute(JobExecutionContext context) {
        OffsetDateTime threshold = OffsetDateTime.now(ZoneOffset.UTC).minusDays(RETENTION_DAYS);

        int deleted = visitRepository.deleteByLastSeenBefore(threshold);
        int matured = visitRepository.markMatureWhereNumVisitsGreaterThan(MATURITY_MIN_VISITS);
        int bucketsRecalculated = bucketRepository.recalculateTotalNumVisits();

        log.info(
                "CellVisit maintenance completed: deletedStaleVisits={} maturedVisits={} bucketsRecalculated={}",
                deleted, matured, bucketsRecalculated
        );
    }
}
