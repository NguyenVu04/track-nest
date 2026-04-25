package project.tracknest.usertracking.domain.tracker.locationcommand.impl;

import com.google.rpc.Code;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import project.tracknest.usertracking.core.datatype.LocationMessage;
import project.tracknest.usertracking.core.entity.Location;
import project.tracknest.usertracking.core.entity.User;
import project.tracknest.usertracking.domain.anomalydetector.service.AnomalyDetectorHandler;
import project.tracknest.usertracking.proto.lib.*;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LocationCommandServiceImplTest {

    @Mock TrackerLocationRepository locationRepository;
    @Mock LocationMessageProducer messageProducer;
    @Mock TrackerUserRepository userRepository;
    @Mock AnomalyDetectorHandler anomalyDetectorHandler;

    @InjectMocks LocationCommandServiceImpl service;

    private static final UUID USER_ID = UUID.fromString("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");

    private User buildUser() {
        return User.builder()
                .id(USER_ID)
                .username("testuser")
                .avatarUrl(null)
                .connected(false)
                .lastActive(OffsetDateTime.now(ZoneOffset.UTC).minusMinutes(10))
                .build();
    }

    private UserLocation validLocation(long timestampMs) {
        return UserLocation.newBuilder()
                .setLatitudeDeg(21.0)
                .setLongitudeDeg(105.0)
                .setTimestampMs(timestampMs)
                .setAccuracyMeter(10.0f)
                .setVelocityMps(1.0f)
                .build();
    }

    // ── updateUserLocation ────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateUserLocation Tests")
    class UpdateUserLocationTests {

        @Test
        void should_updateSuccessfully_withSingleValidLocation() {
            User user = buildUser();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

            UpdateUserLocationRequest req = UpdateUserLocationRequest.newBuilder()
                    .addLocations(validLocation(System.currentTimeMillis()))
                    .build();

            UpdateUserLocationResponse res = service.updateUserLocation(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());

            // user status updated
            assertTrue(user.isConnected());
            assertNotNull(user.getLastActive());
            verify(userRepository).save(user);

            // location saved and kafka published
            verify(locationRepository).save(any(Location.class));
            verify(messageProducer).produce(any(LocationMessage.class));
            verify(anomalyDetectorHandler).detectAnomaly(eq(USER_ID), eq("testuser"), anyDouble(), anyDouble(), any());
        }

        @Test
        void should_saveMultipleLocations_whenMultipleProvided() {
            User user = buildUser();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

            long now = System.currentTimeMillis();
            UpdateUserLocationRequest req = UpdateUserLocationRequest.newBuilder()
                    .addLocations(validLocation(now - 2000))
                    .addLocations(validLocation(now - 1000))
                    .addLocations(validLocation(now))
                    .build();

            UpdateUserLocationResponse res = service.updateUserLocation(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            verify(locationRepository, times(3)).save(any(Location.class));
            verify(messageProducer, times(3)).produce(any(LocationMessage.class));
        }

        @Test
        void should_throwRuntimeException_whenUserNotFound() {
            when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

            UpdateUserLocationRequest req = UpdateUserLocationRequest.newBuilder()
                    .addLocations(validLocation(System.currentTimeMillis()))
                    .build();

            assertThrows(RuntimeException.class, () -> service.updateUserLocation(USER_ID, req));
            verify(locationRepository, never()).save(any());
        }

        @Test
        void should_rejectFutureTimestamp_moreThan5MinutesAhead() {
            User user = buildUser();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

            long futureMs = System.currentTimeMillis() + (6 * 60 * 1000); // +6 minutes
            UpdateUserLocationRequest req = UpdateUserLocationRequest.newBuilder()
                    .addLocations(validLocation(futureMs))
                    .build();

            UpdateUserLocationResponse res = service.updateUserLocation(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            // Future location should be silently skipped
            verify(locationRepository, never()).save(any());
            verify(messageProducer, never()).produce(any());
            verify(anomalyDetectorHandler, never()).detectAnomaly(any(), any(), anyDouble(), anyDouble(), any());
        }

        @Test
        void should_processValidLocations_andSkipFutureTimestamps_inMixedRequest() {
            User user = buildUser();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

            long now = System.currentTimeMillis();
            long futureMs = now + (6 * 60 * 1000); // +6 minutes — rejected

            UpdateUserLocationRequest req = UpdateUserLocationRequest.newBuilder()
                    .addLocations(validLocation(now - 1000))     // valid
                    .addLocations(validLocation(futureMs))        // rejected
                    .addLocations(validLocation(now))             // valid
                    .build();

            UpdateUserLocationResponse res = service.updateUserLocation(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            // Only 2 valid locations should be saved
            verify(locationRepository, times(2)).save(any(Location.class));
        }

        @Test
        void should_returnOk_whenEmptyLocationList() {
            User user = buildUser();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

            UpdateUserLocationRequest req = UpdateUserLocationRequest.newBuilder().build();

            UpdateUserLocationResponse res = service.updateUserLocation(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            verify(locationRepository, never()).save(any());
            verify(messageProducer, never()).produce(any());
        }
    }
}
