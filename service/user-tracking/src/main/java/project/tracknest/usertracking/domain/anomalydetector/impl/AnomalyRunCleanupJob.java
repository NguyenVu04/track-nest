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
public class AnomalyRunCleanupJob implements Job {
    private static final int RETENTION_DAYS = 28;

    private final AnomalyDetectorHandlerAnomalyRunRepository anomalyRunRepository;

    @Override
    @Transactional
    public void execute(JobExecutionContext context) {
        OffsetDateTime threshold = OffsetDateTime.now(ZoneOffset.UTC).minusDays(RETENTION_DAYS);

        int deleted = anomalyRunRepository.deleteResolvedBefore(threshold);

        log.info("AnomalyRun cleanup completed: deletedResolvedRuns={}", deleted);
    }
}
