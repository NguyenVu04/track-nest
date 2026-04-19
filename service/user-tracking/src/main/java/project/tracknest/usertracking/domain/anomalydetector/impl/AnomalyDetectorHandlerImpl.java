package project.tracknest.usertracking.domain.anomalydetector.impl;

import com.uber.h3core.H3Core;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.usertracking.core.datatype.LocationMessage;
import project.tracknest.usertracking.core.datatype.TrackingNotificationMessage;
import project.tracknest.usertracking.core.entity.AnomalyRun;
import project.tracknest.usertracking.core.entity.CellVisit;
import project.tracknest.usertracking.core.entity.LocationBucket;
import project.tracknest.usertracking.domain.anomalydetector.service.AnomalyDetectorHandler;

import java.time.*;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
class AnomalyDetectorHandlerImpl implements AnomalyDetectorHandler {
    private static final int H3_RESOLUTION = 8;
    private static final int MIN_TOTAL_NUM_VISITS = 20;
    private static final long MIN_ANOMALY_INTERVAL_SECONDS = 3600;
    private static final String ANOMALY_NOTIFICATION_TYPE = "ANOMALY_DETECTED";
    private static final String ANOMALY_NOTIFICATION_TITLE = "Anomaly Detected";
    private static final String ANOMALY_NOTIFICATION_BODY_TEMPLATE =
            "Anomaly detected for user %s at timestamp %s. Location: (lat=%.6f, lon=%.6f)";

    @Value("${app.kafka.topics[2]}")
    private String anomalyNotificationTopic;

    private final H3Core h3Core;
    private final EntityManager entityManager;
    private final KafkaTemplate<String, TrackingNotificationMessage> kafkaTemplate;
    private final AnomalyDetectorLocationBucketRepository bucketRepository;
    private final AnomalyDetectorHandlerCellVisitRepository visitRepository;
    private final AnomalyDetectorHandlerAnomalyRunRepository anomalyRunRepository;

    @Async
    @Transactional
    @Override
    public void detectAnomaly(LocationMessage message) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        UUID userId = message.userId();

        Optional<AnomalyRun> openRun = anomalyRunRepository
                .findFirstByUserIdAndResolvedFalseOrderByLastSeenAtDesc(userId);
        LocationBucket bucket = getOrCreateBucket(userId, message.timestampMs());

        if (bucket.getTotalNumVisits() < MIN_TOTAL_NUM_VISITS) {
            log.info(
                    "Skipping anomaly detection for user {} at timestamp {} due to insufficient data (totalNumVisits={})",
                    userId, message.timestampMs(), bucket.getTotalNumVisits()
            );
            openRun.ifPresent(run -> markResolved(run, now));
            return;
        }

        String cellId = h3Core.latLngToCellAddress(
                message.latitudeDeg(), message.longitudeDeg(), H3_RESOLUTION
        );
        Optional<CellVisit> matureVisit = findMatureVisitOrRegisterCandidate(userId, bucket.getId(), cellId);

        if (matureVisit.isPresent()) {
            log.info(
                    "No anomaly detected for user {} at timestamp {} (cellId={})",
                    userId, message.timestampMs(), matureVisit.get().getCellId()
            );
            openRun.ifPresent(run -> markResolved(run, now));
            return;
        }

        if (openRun.isPresent() && shouldSuppress(openRun.get(), now, message)) {
            return;
        }

        raiseAnomaly(message, now);
    }

    private boolean shouldSuppress(AnomalyRun run, OffsetDateTime now, LocationMessage message) {
        if (!run.isResolved()) {
            log.info(
                    "Skipping anomaly detection for user {} at timestamp {} due to unresolved anomaly run (lastSeenAt={})",
                    message.userId(), message.timestampMs(), run.getLastSeenAt()
            );
            return true;
        }

        long secondsSinceLastSeen = Duration.between(run.getLastSeenAt(), now).toSeconds();
        if (secondsSinceLastSeen < MIN_ANOMALY_INTERVAL_SECONDS) {
            log.info(
                    "Skipping anomaly detection for user {} at timestamp {} due to recent anomaly run (lastSeenAt={})",
                    message.userId(), message.timestampMs(), run.getLastSeenAt()
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

    private void raiseAnomaly(LocationMessage message, OffsetDateTime now) {
        AnomalyRun newRun = AnomalyRun.builder()
                .userId(message.userId())
                .resolved(false)
                .startedAt(now)
                .lastSeenAt(now)
                .build();
        anomalyRunRepository.save(newRun);

        TrackingNotificationMessage notification = new TrackingNotificationMessage(
                message.userId(), //TODO: add meaningful information
                String.format(
                        ANOMALY_NOTIFICATION_BODY_TEMPLATE,
                        message.userId(),
                        message.timestampMs(),
                        message.latitudeDeg(),
                        message.longitudeDeg()
                ),
                ANOMALY_NOTIFICATION_TITLE,
                ANOMALY_NOTIFICATION_TYPE
        );
        kafkaTemplate.send(anomalyNotificationTopic, notification);
    }

    private LocationBucket getOrCreateBucket(UUID userId, long timestampMs) {
        LocalDateTime dt = LocalDateTime.ofInstant(
                Instant.ofEpochMilli(timestampMs),
                ZoneOffset.UTC
        );
        short dayOfWeek = (short) dt.getDayOfWeek().getValue();
        short hourOfDay = (short) dt.getHour();

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

    private Optional<CellVisit> findMatureVisitOrRegisterCandidate(UUID userId, UUID bucketId, String cellId) {
        Optional<CellVisit> matureVisit = visitRepository
                .findByUserIdAndCellIdAndBucketIdAndIsMature(userId, cellId, bucketId);

        if (matureVisit.isEmpty()) {
            visitRepository.save(
                    CellVisit.builder()
                            .userId(userId)
                            .cellId(cellId)
                            .bucketId(bucketId)
                            .mature(false)
                            .build()
            );
        }
        return matureVisit;
    }
}
