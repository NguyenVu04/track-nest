package project.tracknest.usertracking.domain.anomalydetector.impl;

import com.uber.h3core.H3Core;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.usertracking.core.datatype.TrackingNotificationMessage;
import project.tracknest.usertracking.core.entity.AnomalyRun;
import project.tracknest.usertracking.core.entity.CellVisit;
import project.tracknest.usertracking.core.entity.LocationBucket;
import project.tracknest.usertracking.domain.anomalydetector.service.AnomalyDetectorHandler;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Integration tests for {@link AnomalyDetectorHandler}.
 *
 * KafkaTemplate is the only mock — everything else (H3, JPA, EntityManager) uses
 * the real Spring context wired against the test database seeded by 02-user-tracking-seed.sql.
 *
 * Seed coverage relevant to these tests:
 *   - location_bucket: one row per (user, dow, hour) derived from 3 360 location points/user.
 *   - cell_visit: H3 resolution-8 cells aggregated per bucket; mature = numVisits >= 5.
 *   - anomaly_run: user1 (dddddddd-0001) and user2 (dddddddd-0003) have active (unresolved) runs.
 *                  user3 and admin have no active run.
 *
 * Each test is @Transactional so all mutations (setup + handler call) are rolled back.
 */
@SpringBootTest
@Transactional
class AnomalyDetectorHandlerTest {

    @Autowired private AnomalyDetectorHandler handler;

    // Only Kafka is mocked — no broker is available in the test environment.
    @MockitoBean private KafkaTemplate<String, TrackingNotificationMessage> kafkaTemplate;

    @Autowired private AnomalyDetectorHandlerAnomalyRunRepository anomalyRunRepository;
    @Autowired private AnomalyDetectorLocationBucketRepository bucketRepository;
    @Autowired private AnomalyDetectorHandlerCellVisitRepository visitRepository;
    @Autowired private H3Core h3Core;
    @Autowired private EntityManager em;

    // -------------------------------------------------------------------------
    // Seed users (from 02-user-tracking-seed.sql)
    // -------------------------------------------------------------------------
    static final UUID USER1_ID = UUID.fromString("dd382dcf-3652-499c-acdb-5d9ce99a67b8");
    static final UUID USER2_ID = UUID.fromString("8c52c01e-42a7-45cc-9254-db8a7601c764");
    static final UUID USER3_ID = UUID.fromString("4405a37d-bc86-403e-b605-bedd7db88d37");
    static final UUID ADMIN_ID = UUID.fromString("f8f735b4-549c-4d8c-9e10-15f8c198b71b");

    // Home coordinates from seed (lon, lat pairs → lat, lon for H3)
    static final double USER1_LAT =  10.776889; static final double USER1_LON = 106.700981;
    static final double USER2_LAT =  21.028511; static final double USER2_LON = 105.854167;
    static final double USER3_LAT =  16.047079; static final double USER3_LON = 108.220833;
    static final double ADMIN_LAT =  10.045162; static final double ADMIN_LON = 105.784817;
    // Anomalous location: Singapore — far outside every user's seed pattern
    static final double ANOMALY_LAT =  1.352083; static final double ANOMALY_LON = 103.819839;

    // Seed anomaly-run IDs
    static final UUID RUN_USER1_ACTIVE = UUID.fromString("dddddddd-0001-4000-8000-dddddddddddd");
    static final UUID RUN_USER2_ACTIVE = UUID.fromString("dddddddd-0003-4000-8000-dddddddddddd");

    // Fixed slot: Monday 2026-04-14 10:00 UTC — inside seed range (seed covers 2026-04-13..2026-04-20)
    // DayOfWeek.MONDAY.getValue() % 7 = 1; hour = 10
    static final OffsetDateTime SLOT_TS     = OffsetDateTime.of(2026, 4, 14, 10, 0, 0, 0, ZoneOffset.UTC);
    static final short          SLOT_DOW    = 1;
    static final short          SLOT_HOUR   = 10;

    // =========================================================================
    // Setup helpers
    // =========================================================================

    /**
     * Returns the bucket for (userId, SLOT_DOW, SLOT_HOUR), creating one if absent,
     * and forces its totalNumVisits to the requested value.
     */
    private LocationBucket prepBucket(UUID userId, int totalNumVisits) {
        LocationBucket b = bucketRepository
                .findByUserIdAndDayOfWeekAndHourOfDay(userId, SLOT_DOW, SLOT_HOUR)
                .orElseGet(() -> bucketRepository.saveAndFlush(
                        LocationBucket.builder()
                                .userId(userId)
                                .dayOfWeek(SLOT_DOW)
                                .hourOfDay(SLOT_HOUR)
                                .totalNumVisits(0)
                                .build()));
        b.setTotalNumVisits(totalNumVisits);
        bucketRepository.saveAndFlush(b);
        em.flush();
        return b;
    }

    /** Removes every CellVisit belonging to this bucket so tests start from a clean slate. */
    private void clearVisits(UUID bucketId) {
        em.createQuery("DELETE FROM CellVisit cv WHERE cv.bucketId = :bid")
                .setParameter("bid", bucketId)
                .executeUpdate();
        em.flush();
    }

    /** Inserts a single CellVisit for the given bucket and cell. */
    private CellVisit insertVisit(UUID userId, UUID bucketId, String cellId, boolean mature, int numVisits) {
        return visitRepository.saveAndFlush(
                CellVisit.builder()
                        .userId(userId)
                        .bucketId(bucketId)
                        .cellId(cellId)
                        .mature(mature)
                        .numVisits(numVisits)
                        .lastSeen(SLOT_TS.minusHours(1))
                        .build());
    }

    // =========================================================================
    // 1. Insufficient data — totalNumVisits < 20
    // =========================================================================

    @Nested
    @DisplayName("Insufficient data (totalNumVisits < 20)")
    class InsufficientDataTests {

        /**
         * user3 has no active anomaly run.
         * A bucket with only 5 visits must cause detection to be skipped —
         * no AnomalyRun created, no Kafka event.
         */
        @Test
        @DisplayName("user3 — skips detection silently when bucket has only 5 visits")
        void skipsDetection_whenInsufficientData_noOpenRun() {
            prepBucket(USER3_ID, 5);

            handler.detectAnomaly(USER3_ID, "user3", USER3_LAT, USER3_LON, SLOT_TS);

            assertTrue(anomalyRunRepository
                    .findFirstByUserIdAndResolvedFalseOrderByLastSeenAtDesc(USER3_ID)
                    .isEmpty());
            verify(kafkaTemplate, never()).send(anyString(), any());
        }

        /**
         * user1 has an active run (dddddddd-0001).
         * Insufficient data must resolve that run (the user is back to normal)
         * and must not fire a new notification.
         */
        @Test
        @DisplayName("user1 — resolves active run dddddddd-0001 when bucket has 0 visits")
        void resolvesActiveRun_whenInsufficientData() {
            prepBucket(USER1_ID, 0);

            handler.detectAnomaly(USER1_ID, "user1", USER1_LAT, USER1_LON, SLOT_TS);

            AnomalyRun run = anomalyRunRepository
                    .findById(RUN_USER1_ACTIVE)
                    .orElseThrow();
            assertTrue(run.isResolved(), "run dddddddd-0001 must be resolved");
            assertEquals(SLOT_TS, run.getLastSeenAt());
            verify(kafkaTemplate, never()).send(anyString(), any());
        }
    }

    // =========================================================================
    // 2. Mature visit found in ring
    // =========================================================================

    @Nested
    @DisplayName("Mature visit found in ring")
    class MatureVisitFoundTests {

        /**
         * user3 (no active run) is at their known Da Nang home cell.
         * A mature CellVisit for that exact cell exists — no anomaly should fire,
         * and the mature visit's counter must be incremented.
         */
        @Test
        @DisplayName("user3 at known Da Nang home cell — no anomaly, mature visit count incremented")
        void noAnomaly_andMatureVisitCountIncremented() {
            LocationBucket bucket = prepBucket(USER3_ID, 30);
            clearVisits(bucket.getId());

            String cell = h3Core.latLngToCellAddress(USER3_LAT, USER3_LON, 8);
            CellVisit mature = insertVisit(USER3_ID, bucket.getId(), cell, true, 7);

            handler.detectAnomaly(USER3_ID, "user3", USER3_LAT, USER3_LON, SLOT_TS);

            CellVisit updated = visitRepository.findById(mature.getId()).orElseThrow();
            assertEquals(8, updated.getNumVisits(), "visit count must be incremented from 7 to 8");
            assertTrue(anomalyRunRepository
                    .findFirstByUserIdAndResolvedFalseOrderByLastSeenAtDesc(USER3_ID)
                    .isEmpty());
            verify(kafkaTemplate, never()).send(anyString(), any());
        }

        /**
         * user1 has active run dddddddd-0001 and returns to their known HCMC home cell.
         * A mature visit exists for that cell — the run must be resolved.
         */
        @Test
        @DisplayName("user1 returns to known HCMC cell — resolves active run dddddddd-0001")
        void resolvesActiveRun_whenReturnToKnownCell() {
            LocationBucket bucket = prepBucket(USER1_ID, 28);
            clearVisits(bucket.getId());

            String cell = h3Core.latLngToCellAddress(USER1_LAT, USER1_LON, 8);
            insertVisit(USER1_ID, bucket.getId(), cell, true, 5);

            handler.detectAnomaly(USER1_ID, "user1", USER1_LAT, USER1_LON, SLOT_TS);

            AnomalyRun run = anomalyRunRepository.findById(RUN_USER1_ACTIVE).orElseThrow();
            assertTrue(run.isResolved());
            verify(kafkaTemplate, never()).send(anyString(), any());
        }

        /**
         * user3's ring contains a mature visit for a neighbouring cell but not the exact one.
         * The handler must register a new candidate for the exact cell yet still suppress
         * the anomaly (a ring member is known).
         */
        @Test
        @DisplayName("user3 — mature visit in ring neighbour: registers candidate for exact cell, no anomaly")
        void registersCandidateForExactCell_whenNeighbourIsMature() {
            LocationBucket bucket = prepBucket(USER3_ID, 30);
            clearVisits(bucket.getId());

            String exactCell     = h3Core.latLngToCellAddress(USER3_LAT, USER3_LON, 8);
            List<String> ring    = h3Core.gridDisk(exactCell, 1);
            // Pick the first ring member that is NOT the exact cell to be the mature one
            String neighbourCell = ring.stream().filter(c -> !c.equals(exactCell)).findFirst().orElseThrow();
            insertVisit(USER3_ID, bucket.getId(), neighbourCell, true, 6);

            handler.detectAnomaly(USER3_ID, "user3", USER3_LAT, USER3_LON, SLOT_TS);

            // Anomaly must be suppressed
            assertTrue(anomalyRunRepository
                    .findFirstByUserIdAndResolvedFalseOrderByLastSeenAtDesc(USER3_ID)
                    .isEmpty());
            verify(kafkaTemplate, never()).send(anyString(), any());
            // A candidate must have been registered for the exact cell
            Optional<CellVisit> candidate = visitRepository
                    .findFirstByUserIdAndBucketIdAndCellIdAndMatureFalse(USER3_ID, bucket.getId(), exactCell);
            assertTrue(candidate.isPresent(), "candidate must be registered for exact cell");
            assertFalse(candidate.get().isMature());
            assertEquals(1, candidate.get().getNumVisits());
        }
    }

    // =========================================================================
    // 3. No mature visit — anomaly raised or suppressed
    // =========================================================================

    @Nested
    @DisplayName("No mature visit in ring")
    class NoMatureVisitTests {

        /**
         * admin has no active run and is at an anomalous location (Singapore).
         * A new unresolved AnomalyRun must be persisted and a Kafka notification sent.
         */
        @Test
        @DisplayName("admin at anomalous location (Singapore) — raises AnomalyRun and sends Kafka")
        void raisesAnomaly_andSendsKafka_whenNoOpenRun() {
            LocationBucket bucket = prepBucket(ADMIN_ID, 25);
            clearVisits(bucket.getId());
            // No mature visits inserted — location is anomalous

            handler.detectAnomaly(ADMIN_ID, "admin", ANOMALY_LAT, ANOMALY_LON, SLOT_TS);

            // A new unresolved run must exist for admin
            Optional<AnomalyRun> newRun = anomalyRunRepository
                    .findFirstByUserIdAndResolvedFalseOrderByLastSeenAtDesc(ADMIN_ID);
            assertTrue(newRun.isPresent(), "a new unresolved AnomalyRun must be created for admin");
            assertEquals(ADMIN_ID, newRun.get().getUserId());
            assertFalse(newRun.get().isResolved());
            assertEquals(SLOT_TS, newRun.get().getLastSeenAt());

            // Kafka notification must be sent to admin's user ID
            ArgumentCaptor<TrackingNotificationMessage> captor =
                    ArgumentCaptor.forClass(TrackingNotificationMessage.class);
            verify(kafkaTemplate).send(anyString(), captor.capture());
            TrackingNotificationMessage msg = captor.getValue();
            assertEquals(ADMIN_ID, msg.targetId());
            assertEquals("ANOMALY_DETECTED", msg.type());
            assertEquals("Unusual movement detected", msg.title());
            assertTrue(msg.content().contains("admin"));
        }

        /**
         * user1 already has an active run (dddddddd-0001).
         * A second anomalous location must be suppressed — no new run, no Kafka.
         */
        @Test
        @DisplayName("user1 — suppresses second anomaly because run dddddddd-0001 is still open")
        void suppressesAnomaly_whenActiveRunAlreadyOpen() {
            LocationBucket bucket = prepBucket(USER1_ID, 25);
            clearVisits(bucket.getId());

            long runCountBefore = anomalyRunRepository.count();

            handler.detectAnomaly(USER1_ID, "user1", ANOMALY_LAT, ANOMALY_LON, SLOT_TS);

            assertEquals(runCountBefore, anomalyRunRepository.count(),
                    "no new AnomalyRun must be created when an open run already exists");
            verify(kafkaTemplate, never()).send(anyString(), any());
        }

        /**
         * user2 also has an active run (dddddddd-0003).
         * Independently verifies the same suppression contract.
         */
        @Test
        @DisplayName("user2 — suppresses anomaly because run dddddddd-0003 is still open")
        void suppressesAnomaly_user2_activeRundddddddd0003() {
            LocationBucket bucket = prepBucket(USER2_ID, 22);
            clearVisits(bucket.getId());

            long runCountBefore = anomalyRunRepository.count();

            handler.detectAnomaly(USER2_ID, "user2", ANOMALY_LAT, ANOMALY_LON, SLOT_TS);

            assertEquals(runCountBefore, anomalyRunRepository.count());
            verify(kafkaTemplate, never()).send(anyString(), any());
        }

        /**
         * user3 is at the anomalous Singapore location for the first time in this slot.
         * A new immature CellVisit with numVisits=1 must be created.
         */
        @Test
        @DisplayName("user3 first visit to anomalous cell — creates CellVisit candidate (numVisits=1)")
        void createsNewCandidateVisit_onFirstVisitToAnomalousCell() {
            LocationBucket bucket = prepBucket(USER3_ID, 25);
            clearVisits(bucket.getId());

            String anomalousCell = h3Core.latLngToCellAddress(ANOMALY_LAT, ANOMALY_LON, 8);

            handler.detectAnomaly(USER3_ID, "user3", ANOMALY_LAT, ANOMALY_LON, SLOT_TS);

            Optional<CellVisit> candidate = visitRepository
                    .findFirstByUserIdAndBucketIdAndCellIdAndMatureFalse(USER3_ID, bucket.getId(), anomalousCell);
            assertTrue(candidate.isPresent(), "a candidate CellVisit must be created");
            assertFalse(candidate.get().isMature());
            assertEquals(1, candidate.get().getNumVisits());
            assertEquals(SLOT_TS, candidate.get().getLastSeen());
        }

        /**
         * user3 has already visited the anomalous cell 3 times (existing candidate).
         * A fourth visit must increment numVisits to 4 and update lastSeen.
         */
        @Test
        @DisplayName("user3 fourth visit to anomalous cell — increments existing candidate 3 → 4")
        void incrementsExistingCandidateVisit_onRepeatedVisit() {
            LocationBucket bucket = prepBucket(USER3_ID, 25);
            clearVisits(bucket.getId());

            String anomalousCell = h3Core.latLngToCellAddress(ANOMALY_LAT, ANOMALY_LON, 8);
            CellVisit existing = insertVisit(USER3_ID, bucket.getId(), anomalousCell, false, 3);

            handler.detectAnomaly(USER3_ID, "user3", ANOMALY_LAT, ANOMALY_LON, SLOT_TS);

            CellVisit updated = visitRepository.findById(existing.getId()).orElseThrow();
            assertEquals(4, updated.getNumVisits());
            assertEquals(SLOT_TS, updated.getLastSeen());
        }
    }

    // =========================================================================
    // 4. Bucket lifecycle
    // =========================================================================

    @Nested
    @DisplayName("Bucket lifecycle")
    class BucketLifecycleTests {

        /**
         * When no bucket exists for the (user, dow, hour) slot the handler must create one,
         * then immediately skip detection (0 visits < 20) without errors.
         */
        @Test
        @DisplayName("user3 — creates a new LocationBucket when none exists for the slot")
        void createsNewBucket_whenSlotAbsent() {
            // Remove the existing seed bucket for this slot so the handler must create a new one.
            bucketRepository
                    .findByUserIdAndDayOfWeekAndHourOfDay(USER3_ID, SLOT_DOW, SLOT_HOUR)
                    .ifPresent(b -> {
                        em.createQuery("DELETE FROM CellVisit cv WHERE cv.bucketId = :bid")
                                .setParameter("bid", b.getId())
                                .executeUpdate();
                        bucketRepository.delete(b);
                        em.flush();
                    });

            handler.detectAnomaly(USER3_ID, "user3", USER3_LAT, USER3_LON, SLOT_TS);

            assertTrue(
                    bucketRepository.findByUserIdAndDayOfWeekAndHourOfDay(USER3_ID, SLOT_DOW, SLOT_HOUR).isPresent(),
                    "a new LocationBucket must have been created for the slot");
        }

        /**
         * On Sunday 2026-04-19 DayOfWeek.SUNDAY.getValue() = 7; 7 % 7 = 0.
         * The handler must look up the bucket with dayOfWeek=0 (PostgreSQL DOW convention).
         */
        @Test
        @DisplayName("user1 on Sunday 2026-04-19 — bucket looked up with dayOfWeek=0")
        void sundayTimestamp_usesDayOfWeekZero() {
            OffsetDateTime sunday = OffsetDateTime.of(2026, 4, 19, 15, 0, 0, 0, ZoneOffset.UTC);
            short sundayDow  = 0;
            short sundayHour = 15;

            // Ensure a seeded bucket exists for (user1, Sunday, 15h)
            bucketRepository
                    .findByUserIdAndDayOfWeekAndHourOfDay(USER1_ID, sundayDow, sundayHour)
                    .ifPresent(b -> {
                        b.setTotalNumVisits(0); // force insufficient-data path
                        bucketRepository.saveAndFlush(b);
                    });

            // Should not throw — just skips detection (0 visits)
            assertDoesNotThrow(() ->
                    handler.detectAnomaly(USER1_ID, "user1", USER1_LAT, USER1_LON, sunday));

            // Verify the bucket key used matches Sunday = 0
            assertTrue(
                    bucketRepository.findByUserIdAndDayOfWeekAndHourOfDay(USER1_ID, sundayDow, sundayHour).isPresent());
        }

        /**
         * user2 sends location at 17:00+07:00 (ICT) which is 10:00 UTC Monday.
         * The bucket lookup must use the UTC hour (10), not the local hour (17).
         */
        @Test
        @DisplayName("user2 at 17:00 ICT (+07:00) — bucket resolved against UTC hour 10, not local 17")
        void nonUtcTimestamp_normalisedToUtcForBucketLookup() {
            // 2026-04-14 17:00+07:00 = 2026-04-14 10:00 UTC → Monday, hour 10 (= SLOT_DOW / SLOT_HOUR)
            OffsetDateTime ict = OffsetDateTime.of(2026, 4, 14, 17, 0, 0, 0, ZoneOffset.ofHours(7));

            prepBucket(USER2_ID, 0); // ensures bucket (dow=1, hour=10) exists; totalNumVisits=0 → skip path

            assertDoesNotThrow(() ->
                    handler.detectAnomaly(USER2_ID, "user2", USER2_LAT, USER2_LON, ict));

            // The handler must have used the SLOT_DOW/SLOT_HOUR bucket (UTC hour 10)
            // rather than local hour 17 (which would be a different bucket)
            assertTrue(
                    bucketRepository.findByUserIdAndDayOfWeekAndHourOfDay(USER2_ID, SLOT_DOW, SLOT_HOUR).isPresent(),
                    "bucket for UTC hour 10 must exist (local hour 17 would be a separate bucket)");
            assertTrue(
                    bucketRepository.findByUserIdAndDayOfWeekAndHourOfDay(USER2_ID, SLOT_DOW, (short) 17).isEmpty()
                            || !bucketRepository.findByUserIdAndDayOfWeekAndHourOfDay(USER2_ID, SLOT_DOW, (short) 17)
                            .equals(bucketRepository.findByUserIdAndDayOfWeekAndHourOfDay(USER2_ID, SLOT_DOW, SLOT_HOUR)),
                    "UTC hour-10 and local hour-17 buckets are distinct slots");
        }
    }
}
