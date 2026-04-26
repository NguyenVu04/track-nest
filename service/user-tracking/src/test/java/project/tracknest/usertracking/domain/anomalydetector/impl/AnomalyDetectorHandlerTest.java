package project.tracknest.usertracking.domain.anomalydetector.impl;

import com.uber.h3core.H3Core;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import project.tracknest.usertracking.core.datatype.TrackingNotificationMessage;
import project.tracknest.usertracking.core.entity.AnomalyRun;
import project.tracknest.usertracking.core.entity.CellVisit;
import project.tracknest.usertracking.core.entity.LocationBucket;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnomalyDetectorHandlerTest {

    @Mock
    AnomalyDetectorHandlerAnomalyRunRepository anomalyRunRepository;

    @Mock
    AnomalyDetectorLocationBucketRepository bucketRepository;

    @Mock
    AnomalyDetectorHandlerCellVisitRepository visitRepository;

    @Mock
    EntityManager entityManager;

    @Mock
    @SuppressWarnings("unchecked")
    KafkaTemplate<String, TrackingNotificationMessage> kafkaTemplate;

    AnomalyDetectorHandlerImpl handler;

    // Coordinates that map to a deterministic H3 cell at resolution 8
    // Hanoi, Vietnam
    private static final double LAT = 21.0278;
    private static final double LON = 105.8342;

    private static final UUID USER_ID = UUID.fromString("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    private static final String USERNAME = "testuser";

    @BeforeEach
    void setUp() throws IOException {
        H3Core h3Core = H3Core.newInstance();
        handler = new AnomalyDetectorHandlerImpl(
                h3Core, entityManager, kafkaTemplate,
                bucketRepository, visitRepository, anomalyRunRepository);
        ReflectionTestUtils.setField(handler, "anomalyNotificationTopic", "tracking-notification");
    }

    // ── Helper builders ───────────────────────────────────────────────────────

    private LocationBucket bucketWithVisits(int totalVisits) {
        return LocationBucket.builder()
                .id(UUID.randomUUID())
                .userId(USER_ID)
                .dayOfWeek((short) 1)
                .hourOfDay((short) 10)
                .totalNumVisits(totalVisits)
                .build();
    }

    private AnomalyRun openRun() {
        return AnomalyRun.builder()
                .id(UUID.randomUUID())
                .userId(USER_ID)
                .resolved(false)
                .lastSeenAt(OffsetDateTime.now(ZoneOffset.UTC))
                .build();
    }

    private AnomalyRun resolvedRun(long secondsAgo) {
        return AnomalyRun.builder()
                .id(UUID.randomUUID())
                .userId(USER_ID)
                .resolved(true)
                .lastSeenAt(OffsetDateTime.now(ZoneOffset.UTC).minusSeconds(secondsAgo))
                .build();
    }

    private CellVisit matureCellVisit(String cellId, UUID bucketId) {
        return CellVisit.builder()
                .id(UUID.randomUUID())
                .userId(USER_ID)
                .bucketId(bucketId)
                .cellId(cellId)
                .mature(true)
                .numVisits(10)
                .lastSeen(OffsetDateTime.now(ZoneOffset.UTC))
                .build();
    }

    private CellVisit candidateCellVisit(String cellId, UUID bucketId, int numVisits) {
        return CellVisit.builder()
                .id(UUID.randomUUID())
                .userId(USER_ID)
                .bucketId(bucketId)
                .cellId(cellId)
                .mature(false)
                .numVisits(numVisits)
                .lastSeen(OffsetDateTime.now(ZoneOffset.UTC))
                .build();
    }

    private OffsetDateTime nowUtc() {
        return OffsetDateTime.now(ZoneOffset.UTC);
    }

    // ── InsufficientData ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("InsufficientData Tests")
    class InsufficientDataTests {

        @Test
        @DisplayName("skips detection when totalNumVisits < 20 and no open run")
        void skipsDetection_whenInsufficientData_noOpenRun() {
            LocationBucket bucket = bucketWithVisits(5);
            when(anomalyRunRepository.findFirstByUserIdOrderByLastSeenAtDesc(USER_ID))
                    .thenReturn(Optional.empty());
            when(bucketRepository.findByUserIdAndDayOfWeekAndHourOfDay(any(), anyShort(), anyShort()))
                    .thenReturn(Optional.of(bucket));

            handler.detectAnomaly(USER_ID, USERNAME, LAT, LON, nowUtc());

            verify(kafkaTemplate, never()).send(anyString(), any(TrackingNotificationMessage.class));
            verify(anomalyRunRepository, never()).save(any(AnomalyRun.class));
        }

        @Test
        @DisplayName("resolves active run when totalNumVisits < 20")
        void resolvesActiveRun_whenInsufficientData() {
            LocationBucket bucket = bucketWithVisits(0);
            AnomalyRun activeRun = openRun();
            when(anomalyRunRepository.findFirstByUserIdOrderByLastSeenAtDesc(USER_ID))
                    .thenReturn(Optional.of(activeRun));
            when(bucketRepository.findByUserIdAndDayOfWeekAndHourOfDay(any(), anyShort(), anyShort()))
                    .thenReturn(Optional.of(bucket));

            handler.detectAnomaly(USER_ID, USERNAME, LAT, LON, nowUtc());

            ArgumentCaptor<AnomalyRun> captor = ArgumentCaptor.forClass(AnomalyRun.class);
            verify(anomalyRunRepository).save(captor.capture());
            assertTrue(captor.getValue().isResolved());
            verify(kafkaTemplate, never()).send(anyString(), any(TrackingNotificationMessage.class));
        }
    }

    // ── MatureVisitFound ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("MatureVisitFound Tests")
    class MatureVisitFoundTests {

        @Test
        @DisplayName("no anomaly and increments mature cell visit count")
        void noAnomaly_andMatureVisitCountIncremented() {
            LocationBucket bucket = bucketWithVisits(30);
            H3Core h3;
            try { h3 = H3Core.newInstance(); } catch (IOException e) { throw new RuntimeException(e); }

            String cellId = h3.latLngToCellAddress(LAT, LON, 8);
            CellVisit mature = matureCellVisit(cellId, bucket.getId());

            when(anomalyRunRepository.findFirstByUserIdOrderByLastSeenAtDesc(USER_ID))
                    .thenReturn(Optional.empty());
            when(bucketRepository.findByUserIdAndDayOfWeekAndHourOfDay(any(), anyShort(), anyShort()))
                    .thenReturn(Optional.of(bucket));
            when(visitRepository.findFirstByUserIdAndBucketIdAndCellIdInAndMatureTrue(any(), any(), anyList()))
                    .thenReturn(Optional.of(mature));

            handler.detectAnomaly(USER_ID, USERNAME, LAT, LON, nowUtc());

            verify(kafkaTemplate, never()).send(anyString(), any(TrackingNotificationMessage.class));
            // mature visit count should be incremented
            ArgumentCaptor<CellVisit> visitCaptor = ArgumentCaptor.forClass(CellVisit.class);
            verify(visitRepository).save(visitCaptor.capture());
            assertEquals(11, visitCaptor.getValue().getNumVisits());
        }

        @Test
        @DisplayName("resolves active run when user returns to known cell")
        void resolvesActiveRun_whenReturnToKnownCell() {
            LocationBucket bucket = bucketWithVisits(25);
            H3Core h3;
            try { h3 = H3Core.newInstance(); } catch (IOException e) { throw new RuntimeException(e); }

            String cellId = h3.latLngToCellAddress(LAT, LON, 8);
            CellVisit mature = matureCellVisit(cellId, bucket.getId());
            AnomalyRun activeRun = openRun();

            when(anomalyRunRepository.findFirstByUserIdOrderByLastSeenAtDesc(USER_ID))
                    .thenReturn(Optional.of(activeRun));
            when(bucketRepository.findByUserIdAndDayOfWeekAndHourOfDay(any(), anyShort(), anyShort()))
                    .thenReturn(Optional.of(bucket));
            when(visitRepository.findFirstByUserIdAndBucketIdAndCellIdInAndMatureTrue(any(), any(), anyList()))
                    .thenReturn(Optional.of(mature));

            handler.detectAnomaly(USER_ID, USERNAME, LAT, LON, nowUtc());

            ArgumentCaptor<AnomalyRun> captor = ArgumentCaptor.forClass(AnomalyRun.class);
            // one save for the run (resolve) + one for the mature visit (increment)
            verify(anomalyRunRepository).save(captor.capture());
            assertTrue(captor.getValue().isResolved());
            verify(kafkaTemplate, never()).send(anyString(), any(TrackingNotificationMessage.class));
        }

        @Test
        @DisplayName("registers candidate visit when only a neighbour cell is mature")
        void registersCandidateForExactCell_whenNeighbourIsMature() {
            LocationBucket bucket = bucketWithVisits(30);
            H3Core h3;
            try { h3 = H3Core.newInstance(); } catch (IOException e) { throw new RuntimeException(e); }

            String cellId = h3.latLngToCellAddress(LAT, LON, 8);
            List<String> ring = h3.gridDisk(cellId, 1);
            // Use a neighbour cell as the "mature" one (not the exact cell)
            String neighbourCell = ring.stream().filter(c -> !c.equals(cellId)).findFirst().orElseThrow();
            CellVisit neighbourMature = matureCellVisit(neighbourCell, bucket.getId());

            when(anomalyRunRepository.findFirstByUserIdOrderByLastSeenAtDesc(USER_ID))
                    .thenReturn(Optional.empty());
            when(bucketRepository.findByUserIdAndDayOfWeekAndHourOfDay(any(), anyShort(), anyShort()))
                    .thenReturn(Optional.of(bucket));
            when(visitRepository.findFirstByUserIdAndBucketIdAndCellIdInAndMatureTrue(any(), any(), anyList()))
                    .thenReturn(Optional.of(neighbourMature));
            when(visitRepository.findFirstByUserIdAndBucketIdAndCellIdAndMatureFalse(any(), any(), eq(cellId)))
                    .thenReturn(Optional.empty());

            handler.detectAnomaly(USER_ID, USERNAME, LAT, LON, nowUtc());

            // A candidate (immature) cell visit for the exact cell should be created
            ArgumentCaptor<CellVisit> visitCaptor = ArgumentCaptor.forClass(CellVisit.class);
            verify(visitRepository, atLeastOnce()).save(visitCaptor.capture());
            boolean newCandidateSaved = visitCaptor.getAllValues().stream()
                    .anyMatch(v -> !v.isMature() && v.getCellId().equals(cellId) && v.getNumVisits() == 1);
            assertTrue(newCandidateSaved, "Expected a new candidate CellVisit to be saved for the exact cell");
        }
    }

    // ── NoMatureVisit ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("NoMatureVisit Tests")
    class NoMatureVisitTests {

        @Test
        @DisplayName("raises anomaly and sends Kafka when no open run exists")
        void raisesAnomaly_andSendsKafka_whenNoOpenRun() {
            LocationBucket bucket = bucketWithVisits(25);
            when(anomalyRunRepository.findFirstByUserIdOrderByLastSeenAtDesc(USER_ID))
                    .thenReturn(Optional.empty());
            when(bucketRepository.findByUserIdAndDayOfWeekAndHourOfDay(any(), anyShort(), anyShort()))
                    .thenReturn(Optional.of(bucket));
            when(visitRepository.findFirstByUserIdAndBucketIdAndCellIdInAndMatureTrue(any(), any(), anyList()))
                    .thenReturn(Optional.empty());
            when(visitRepository.findFirstByUserIdAndBucketIdAndCellIdAndMatureFalse(any(), any(), anyString()))
                    .thenReturn(Optional.empty());

            handler.detectAnomaly(USER_ID, USERNAME, LAT, LON, nowUtc());

            ArgumentCaptor<AnomalyRun> runCaptor = ArgumentCaptor.forClass(AnomalyRun.class);
            verify(anomalyRunRepository).save(runCaptor.capture());
            assertFalse(runCaptor.getValue().isResolved());
            assertEquals(USER_ID, runCaptor.getValue().getUserId());

            verify(kafkaTemplate).send(eq("tracking-notification"), any(TrackingNotificationMessage.class));
        }

        @Test
        @DisplayName("suppresses anomaly when an active (unresolved) run already exists")
        void suppressesAnomaly_whenActiveRunAlreadyOpen() {
            LocationBucket bucket = bucketWithVisits(25);
            AnomalyRun activeRun = openRun();
            when(anomalyRunRepository.findFirstByUserIdOrderByLastSeenAtDesc(USER_ID))
                    .thenReturn(Optional.of(activeRun));
            when(bucketRepository.findByUserIdAndDayOfWeekAndHourOfDay(any(), anyShort(), anyShort()))
                    .thenReturn(Optional.of(bucket));
            when(visitRepository.findFirstByUserIdAndBucketIdAndCellIdInAndMatureTrue(any(), any(), anyList()))
                    .thenReturn(Optional.empty());
            when(visitRepository.findFirstByUserIdAndBucketIdAndCellIdAndMatureFalse(any(), any(), anyString()))
                    .thenReturn(Optional.empty());

            handler.detectAnomaly(USER_ID, USERNAME, LAT, LON, nowUtc());

            verify(kafkaTemplate, never()).send(anyString(), any(TrackingNotificationMessage.class));
            // The existing run must NOT be saved as a new one
            verify(anomalyRunRepository, never()).save(argThat(r -> !r.isResolved() && r.getId() == null));
        }

        @Test
        @DisplayName("suppresses anomaly when resolved run is too recent (< 3600s ago)")
        void suppressesAnomaly_resolvedRunTooRecent() {
            LocationBucket bucket = bucketWithVisits(25);
            AnomalyRun recentResolved = resolvedRun(1000); // 1000s ago < 3600s threshold
            when(anomalyRunRepository.findFirstByUserIdOrderByLastSeenAtDesc(USER_ID))
                    .thenReturn(Optional.of(recentResolved));
            when(bucketRepository.findByUserIdAndDayOfWeekAndHourOfDay(any(), anyShort(), anyShort()))
                    .thenReturn(Optional.of(bucket));
            when(visitRepository.findFirstByUserIdAndBucketIdAndCellIdInAndMatureTrue(any(), any(), anyList()))
                    .thenReturn(Optional.empty());
            when(visitRepository.findFirstByUserIdAndBucketIdAndCellIdAndMatureFalse(any(), any(), anyString()))
                    .thenReturn(Optional.empty());

            handler.detectAnomaly(USER_ID, USERNAME, LAT, LON, nowUtc());

            verify(kafkaTemplate, never()).send(anyString(), any(TrackingNotificationMessage.class));
        }

        @Test
        @DisplayName("raises anomaly when resolved run is old enough (>= 3600s ago)")
        void raisesAnomaly_resolvedRunOldEnough() {
            LocationBucket bucket = bucketWithVisits(25);
            AnomalyRun oldResolved = resolvedRun(4000); // 4000s ago > 3600s threshold
            when(anomalyRunRepository.findFirstByUserIdOrderByLastSeenAtDesc(USER_ID))
                    .thenReturn(Optional.of(oldResolved));
            when(bucketRepository.findByUserIdAndDayOfWeekAndHourOfDay(any(), anyShort(), anyShort()))
                    .thenReturn(Optional.of(bucket));
            when(visitRepository.findFirstByUserIdAndBucketIdAndCellIdInAndMatureTrue(any(), any(), anyList()))
                    .thenReturn(Optional.empty());
            when(visitRepository.findFirstByUserIdAndBucketIdAndCellIdAndMatureFalse(any(), any(), anyString()))
                    .thenReturn(Optional.empty());

            handler.detectAnomaly(USER_ID, USERNAME, LAT, LON, nowUtc());

            verify(kafkaTemplate).send(eq("tracking-notification"), any(TrackingNotificationMessage.class));
        }

        @Test
        @DisplayName("creates new candidate visit on first anomalous cell visit")
        void createsNewCandidateVisit_onFirstVisitToAnomalousCell() {
            LocationBucket bucket = bucketWithVisits(25);
            when(anomalyRunRepository.findFirstByUserIdOrderByLastSeenAtDesc(USER_ID))
                    .thenReturn(Optional.empty());
            when(bucketRepository.findByUserIdAndDayOfWeekAndHourOfDay(any(), anyShort(), anyShort()))
                    .thenReturn(Optional.of(bucket));
            when(visitRepository.findFirstByUserIdAndBucketIdAndCellIdInAndMatureTrue(any(), any(), anyList()))
                    .thenReturn(Optional.empty());
            when(visitRepository.findFirstByUserIdAndBucketIdAndCellIdAndMatureFalse(any(), any(), anyString()))
                    .thenReturn(Optional.empty());

            handler.detectAnomaly(USER_ID, USERNAME, LAT, LON, nowUtc());

            ArgumentCaptor<CellVisit> visitCaptor = ArgumentCaptor.forClass(CellVisit.class);
            verify(visitRepository).save(visitCaptor.capture());
            CellVisit saved = visitCaptor.getValue();
            assertFalse(saved.isMature());
            assertEquals(1, saved.getNumVisits());
        }

        @Test
        @DisplayName("increments existing candidate visit on repeated anomalous visit")
        void incrementsExistingCandidateVisit_onRepeatedVisit() {
            LocationBucket bucket = bucketWithVisits(25);
            H3Core h3;
            try { h3 = H3Core.newInstance(); } catch (IOException e) { throw new RuntimeException(e); }
            String cellId = h3.latLngToCellAddress(LAT, LON, 8);
            CellVisit existing = candidateCellVisit(cellId, bucket.getId(), 3);

            when(anomalyRunRepository.findFirstByUserIdOrderByLastSeenAtDesc(USER_ID))
                    .thenReturn(Optional.empty());
            when(bucketRepository.findByUserIdAndDayOfWeekAndHourOfDay(any(), anyShort(), anyShort()))
                    .thenReturn(Optional.of(bucket));
            when(visitRepository.findFirstByUserIdAndBucketIdAndCellIdInAndMatureTrue(any(), any(), anyList()))
                    .thenReturn(Optional.empty());
            when(visitRepository.findFirstByUserIdAndBucketIdAndCellIdAndMatureFalse(any(), any(), anyString()))
                    .thenReturn(Optional.of(existing));

            handler.detectAnomaly(USER_ID, USERNAME, LAT, LON, nowUtc());

            ArgumentCaptor<CellVisit> visitCaptor = ArgumentCaptor.forClass(CellVisit.class);
            verify(visitRepository).save(visitCaptor.capture());
            assertEquals(4, visitCaptor.getValue().getNumVisits());
        }
    }

    // ── BucketLifecycle ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("BucketLifecycle Tests")
    class BucketLifecycleTests {

        @Test
        @DisplayName("creates new bucket when slot absent")
        void createsNewBucket_whenSlotAbsent() {
            LocationBucket newBucket = bucketWithVisits(0);
            newBucket.setId(UUID.randomUUID());
            when(anomalyRunRepository.findFirstByUserIdOrderByLastSeenAtDesc(USER_ID))
                    .thenReturn(Optional.empty());
            when(bucketRepository.findByUserIdAndDayOfWeekAndHourOfDay(any(), anyShort(), anyShort()))
                    .thenReturn(Optional.empty());
            when(bucketRepository.saveAndFlush(any(LocationBucket.class))).thenReturn(newBucket);
            doNothing().when(entityManager).refresh(any());

            handler.detectAnomaly(USER_ID, USERNAME, LAT, LON, nowUtc());

            verify(bucketRepository).saveAndFlush(any(LocationBucket.class));
            verify(entityManager).refresh(newBucket);
            // No anomaly since totalNumVisits == 0 < 20
            verify(kafkaTemplate, never()).send(anyString(), any(TrackingNotificationMessage.class));
        }

        @Test
        @DisplayName("Sunday timestamp maps to dayOfWeek=6 (ISO: (getValue()-1)%7, Sun=7 → 6)")
        void sundayTimestamp_usesDayOfWeekSix() {
            // 2025-01-05 is a Sunday. DayOfWeek.SUNDAY.getValue() = 7.
            // Formula: (7 - 1) % 7 = 6
            OffsetDateTime sunday = OffsetDateTime.of(2025, 1, 5, 10, 0, 0, 0, ZoneOffset.UTC);

            LocationBucket bucket = bucketWithVisits(0);
            when(anomalyRunRepository.findFirstByUserIdOrderByLastSeenAtDesc(USER_ID))
                    .thenReturn(Optional.empty());
            when(bucketRepository.findByUserIdAndDayOfWeekAndHourOfDay(any(), anyShort(), anyShort()))
                    .thenReturn(Optional.of(bucket));

            handler.detectAnomaly(USER_ID, USERNAME, LAT, LON, sunday);

            ArgumentCaptor<Short> dowCaptor = ArgumentCaptor.forClass(Short.class);
            verify(bucketRepository).findByUserIdAndDayOfWeekAndHourOfDay(
                    eq(USER_ID), dowCaptor.capture(), anyShort());
            assertEquals((short) 6, dowCaptor.getValue());
        }

        @Test
        @DisplayName("non-UTC timestamp is normalised to UTC for bucket lookup")
        void nonUtcTimestamp_normalisedToUtcForBucketLookup() {
            // 17:00 +07:00 = 10:00 UTC → hourOfDay should be 10
            OffsetDateTime localTime = OffsetDateTime.of(2025, 6, 16, 17, 0, 0, 0,
                    ZoneOffset.ofHours(7));

            LocationBucket bucket = bucketWithVisits(0);
            when(anomalyRunRepository.findFirstByUserIdOrderByLastSeenAtDesc(USER_ID))
                    .thenReturn(Optional.empty());
            when(bucketRepository.findByUserIdAndDayOfWeekAndHourOfDay(any(), anyShort(), anyShort()))
                    .thenReturn(Optional.of(bucket));

            handler.detectAnomaly(USER_ID, USERNAME, LAT, LON, localTime);

            ArgumentCaptor<Short> hourCaptor = ArgumentCaptor.forClass(Short.class);
            verify(bucketRepository).findByUserIdAndDayOfWeekAndHourOfDay(
                    eq(USER_ID), anyShort(), hourCaptor.capture());
            assertEquals((short) 10, hourCaptor.getValue());
        }
    }
}
