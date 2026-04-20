package project.tracknest.usertracking.domain.anomalydetector.impl;

import com.uber.h3core.H3Core;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.usertracking.core.datatype.TrackingNotificationMessage;
import project.tracknest.usertracking.core.entity.AnomalyRun;
import project.tracknest.usertracking.core.entity.CellVisit;
import project.tracknest.usertracking.core.entity.LocationBucket;
import project.tracknest.usertracking.domain.anomalydetector.service.AnomalyDetectorHandler;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
class AnomalyDetectorHandlerImpl implements AnomalyDetectorHandler {
    private static final int H3_RESOLUTION = 8;
    private static final int H3_RING_SIZE = 1;
    private static final int MIN_TOTAL_NUM_VISITS = 20;
    private static final long MIN_ANOMALY_INTERVAL_SECONDS = 3600;
    private static final String ANOMALY_NOTIFICATION_TYPE = "ANOMALY_DETECTED";
    private static final String ANOMALY_NOTIFICATION_TITLE = "Unusual movement detected";
    private static final String ANOMALY_NOTIFICATION_BODY_TEMPLATE = """
            %s is showing movement that differs from their usual pattern.
            This may be normal, but you may want to check in.
            """;

    @Value("${app.kafka.topics[2]}")
    private String anomalyNotificationTopic;

    private final H3Core h3Core;
    private final EntityManager entityManager;
    private final KafkaTemplate<String, TrackingNotificationMessage> kafkaTemplate;
    private final AnomalyDetectorLocationBucketRepository bucketRepository;
    private final AnomalyDetectorHandlerCellVisitRepository visitRepository;
    private final AnomalyDetectorHandlerAnomalyRunRepository anomalyRunRepository;

    @Transactional
    @Override
    public void detectAnomaly(
            UUID userId,
            String username,
            double latitudeDeg,
            double longitudeDeg,
            OffsetDateTime timestamp
    ) {
        Optional<AnomalyRun> openRun = anomalyRunRepository
                .findFirstByUserIdAndResolvedFalseOrderByLastSeenAtDesc(userId);
        LocationBucket bucket = getOrCreateBucket(userId, timestamp);

        if (bucket.getTotalNumVisits() < MIN_TOTAL_NUM_VISITS) {
            log.info(
                    "Skipping anomaly detection for user {} at timestamp {} due to insufficient data (totalNumVisits={})",
                    userId, timestamp, bucket.getTotalNumVisits()
            );
            openRun.ifPresent(run -> markResolved(run, timestamp));
            return;
        }

        String cellId = h3Core.latLngToCellAddress(latitudeDeg, longitudeDeg, H3_RESOLUTION);
        List<String> ringCellIds = h3Core.gridDisk(cellId, H3_RING_SIZE);
        log.info(
                "Detecting anomaly for user {} at timestamp {} in bucket {} (cellId={}, ringCellIds={})",
                userId, timestamp, bucket.getId(), cellId, ringCellIds
        );
        Optional<CellVisit> matureVisit = findMatureVisitInRingOrRegisterCandidate(
                userId, bucket.getId(), cellId, ringCellIds, timestamp
        );

        if (matureVisit.isPresent()) {
            log.info(
                    "No anomaly detected for user {} at timestamp {} (matureCellId={})",
                    userId, timestamp, matureVisit.get().getCellId()
            );
            openRun.ifPresent(run -> markResolved(run, timestamp));
            return;
        }

        if (openRun.isPresent() && shouldSuppress(openRun.get(), timestamp, userId, timestamp)) {
            return;
        }

        raiseAnomaly(userId, username, timestamp);
    }

    private boolean shouldSuppress(AnomalyRun run, OffsetDateTime now, UUID userId, OffsetDateTime timestamp) {
        if (!run.isResolved()) {
            log.info(
                    "Skipping anomaly detection for user {} at timestamp {} due to unresolved anomaly run (lastSeenAt={})",
                    userId, timestamp, run.getLastSeenAt()
            );
            return true;
        }

        long secondsSinceLastSeen = Duration.between(run.getLastSeenAt(), now).toSeconds();
        if (secondsSinceLastSeen < MIN_ANOMALY_INTERVAL_SECONDS) {
            log.info(
                    "Skipping anomaly detection for user {} at timestamp {} due to recent anomaly run (lastSeenAt={})",
                    userId, timestamp, run.getLastSeenAt()
            );
            return true;
        }
        return false;
    }

    private void markResolved(AnomalyRun run, OffsetDateTime now) {
        run.setLastSeenAt(now);
        run.setResolved(true);
        anomalyRunRepository.save(run);
    }

    private void raiseAnomaly(UUID userId, String username, OffsetDateTime now) {
        log.info(
                "Raising anomaly for user {} at timestamp {} (username={})",
                userId, now, username
        );

        AnomalyRun newRun = AnomalyRun.builder()
                .userId(userId)
                .resolved(false)
                .startedAt(now)
                .lastSeenAt(now)
                .build();
        anomalyRunRepository.save(newRun);

        TrackingNotificationMessage notification = new TrackingNotificationMessage(
                userId,
                String.format(ANOMALY_NOTIFICATION_BODY_TEMPLATE, username),
                ANOMALY_NOTIFICATION_TITLE,
                ANOMALY_NOTIFICATION_TYPE
        );
        kafkaTemplate.send(anomalyNotificationTopic, notification);
    }

    private LocationBucket getOrCreateBucket(UUID userId, OffsetDateTime timestamp) {
        OffsetDateTime utc = timestamp.withOffsetSameInstant(ZoneOffset.UTC);
        short dayOfWeek = (short) ((utc.getDayOfWeek().getValue() - 1) % 7);
        short hourOfDay = (short) utc.getHour();

        return bucketRepository
                .findByUserIdAndDayOfWeekAndHourOfDay(userId, dayOfWeek, hourOfDay)
                .orElseGet(() -> {
                    LocationBucket saved = bucketRepository.saveAndFlush(
                            LocationBucket.builder()
                                    .userId(userId)
                                    .dayOfWeek(dayOfWeek)
                                    .hourOfDay(hourOfDay)
                                    .build()
                    );
                    entityManager.refresh(saved);
                    return saved;
                });
    }

    private Optional<CellVisit> findMatureVisitInRingOrRegisterCandidate(
            UUID userId, UUID bucketId, String cellId, List<String> ringCellIds, OffsetDateTime timestamp
    ) {
        Optional<CellVisit> matureVisit = visitRepository
                .findFirstByUserIdAndBucketIdAndCellIdInAndMatureTrue(userId, bucketId, ringCellIds);

        if (matureVisit.isEmpty() || !matureVisit.get().getCellId().equals(cellId)) {
            Optional<CellVisit> existingCandidate = visitRepository
                    .findFirstByUserIdAndBucketIdAndCellIdAndMatureFalse(userId, bucketId, cellId);
            if (existingCandidate.isPresent()) {
                CellVisit visit = existingCandidate.get();
                visit.setLastSeen(timestamp);
                visit.setNumVisits(visit.getNumVisits() + 1);
                visitRepository.save(visit);
            } else {
                visitRepository.save(
                        CellVisit.builder()
                                .userId(userId)
                                .cellId(cellId)
                                .bucketId(bucketId)
                                .mature(false)
                                .lastSeen(timestamp)
                                .numVisits(1)
                                .build()
                );
            }
        } else {
            CellVisit visit = matureVisit.get();
            visit.setNumVisits(visit.getNumVisits() + 1);
            visit.setLastSeen(timestamp);
            visitRepository.save(visit);
        }
        return matureVisit;
    }
}
