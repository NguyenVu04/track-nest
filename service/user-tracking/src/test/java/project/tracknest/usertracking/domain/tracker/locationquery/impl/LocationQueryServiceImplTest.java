package project.tracknest.usertracking.domain.tracker.locationquery.impl;

import com.google.rpc.Code;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import project.tracknest.usertracking.configuration.redis.ServerRedisMessagePublisher;
import project.tracknest.usertracking.core.datatype.LocationMessage;
import project.tracknest.usertracking.core.entity.Location;
import project.tracknest.usertracking.core.entity.User;
import project.tracknest.usertracking.proto.lib.*;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LocationQueryServiceImplTest {

    @Mock LocationObserver observer;
    @Mock LocationQueryLocationRepository locationRepository;
    @Mock LocationQueryUserRepository userRepository;
    @Mock ServerRedisMessagePublisher redisPublisher;

    @InjectMocks LocationQueryServiceImpl service;

    private static final UUID USER_ID = UUID.fromString("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    private static final UUID MEMBER_ID = UUID.fromString("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    private static final UUID CIRCLE_ID = UUID.fromString("cccccccc-cccc-4ccc-8ccc-cccccccccccc");

    private User buildUser(UUID id) {
        return User.builder()
                .id(id)
                .username("user-" + id.toString().substring(0, 4))
                .connected(true)
                .avatarUrl(null)
                .lastActive(OffsetDateTime.now(ZoneOffset.UTC))
                .build();
    }

    private Location buildLocation(UUID userId) {
        User user = buildUser(userId);
        return Location.builder()
                .id(Location.LocationId.builder()
                        .userId(userId)
                        .timestamp(OffsetDateTime.now(ZoneOffset.UTC))
                        .build())
                .latitude(21.0)
                .longitude(105.0)
                .accuracy(5.0f)
                .velocity(1.0f)
                .user(user)
                .build();
    }

    private LocationMessage buildLocationMessage(UUID userId) {
        return LocationMessage.builder()
                .userId(userId)
                .username("user")
                .latitudeDeg(21.0)
                .longitudeDeg(105.0)
                .accuracyMeter(5.0f)
                .velocityMps(1.0f)
                .timestampMs(System.currentTimeMillis())
                .build();
    }

    // ── trackTarget ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("trackTarget Tests")
    class TrackTargetTests {

        @Test
        void should_publishToAllFamilyMembers() {
            User member1 = buildUser(MEMBER_ID);
            User member2 = buildUser(UUID.randomUUID());
            when(userRepository.findAllUserFamilyMembers(USER_ID)).thenReturn(List.of(member1, member2));

            LocationMessage message = buildLocationMessage(USER_ID);
            service.trackTaget(message);

            verify(redisPublisher, times(2)).publishMessage(any(), any(UUID.class), eq(false));
        }

        @Test
        void should_notPublish_whenNoFamilyMembers() {
            when(userRepository.findAllUserFamilyMembers(USER_ID)).thenReturn(List.of());

            service.trackTaget(buildLocationMessage(USER_ID));

            verify(redisPublisher, never()).publishMessage(any(), any(), anyBoolean());
        }
    }

    // ── receiveLocationMessage ────────────────────────────────────────────────

    @Nested
    @DisplayName("receiveLocationMessage Tests")
    class ReceiveLocationMessageTests {

        @Test
        void should_delegateToObserver() {
            LocationMessage message = buildLocationMessage(USER_ID);

            service.receiveLocationMessage(MEMBER_ID, message);

            verify(observer).sendTargetLocation(MEMBER_ID, message);
        }

        @Test
        void should_notPropagateException_whenObserverThrows() {
            LocationMessage message = buildLocationMessage(USER_ID);
            doThrow(new RuntimeException("Observer failure"))
                    .when(observer).sendTargetLocation(any(), any());

            assertDoesNotThrow(() -> service.receiveLocationMessage(MEMBER_ID, message));
        }
    }

    // ── streamFamilyMemberLocations ───────────────────────────────────────────

    @Nested
    @DisplayName("streamFamilyMemberLocations Tests")
    class StreamFamilyMemberLocationsTests {

        @Test
        void should_returnLocations_whenUserIsMember() {
            User member = buildUser(MEMBER_ID);
            Location location = buildLocation(MEMBER_ID);

            when(userRepository.isCircleMember(USER_ID, CIRCLE_ID)).thenReturn(true);
            when(userRepository.findAllUserFamilyMembersInCircle(USER_ID, CIRCLE_ID)).thenReturn(List.of(member));
            when(locationRepository.findLatestByUserIdIn(any())).thenReturn(List.of(location));

            StreamFamilyMemberLocationsRequest req = StreamFamilyMemberLocationsRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .build();

            List<FamilyMemberLocation> result = service.streamFamilyMemberLocations(USER_ID, req);

            assertEquals(1, result.size());
            FamilyMemberLocation loc = result.get(0);
            assertEquals(MEMBER_ID.toString(), loc.getMemberId());
            assertEquals(21.0, loc.getLatitudeDeg(), 0.001);
            assertEquals(105.0, loc.getLongitudeDeg(), 0.001);
        }

        @Test
        void should_throwIllegalArgument_whenUserNotMember() {
            when(userRepository.findAllUserFamilyMembersInCircle(USER_ID, CIRCLE_ID)).thenReturn(List.of());
            when(userRepository.isCircleMember(USER_ID, CIRCLE_ID)).thenReturn(false);

            StreamFamilyMemberLocationsRequest req = StreamFamilyMemberLocationsRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .build();

            assertThrows(IllegalArgumentException.class,
                    () -> service.streamFamilyMemberLocations(USER_ID, req));
        }
    }

    // ── listFamilyMemberLocationHistory ──────────────────────────────────────

    @Nested
    @DisplayName("listFamilyMemberLocationHistory Tests")
    class ListFamilyMemberLocationHistoryTests {

        @Test
        void should_returnHistory_withNoSpatialFilter() {
            User member = buildUser(MEMBER_ID);
            Location location = buildLocation(MEMBER_ID);

            when(userRepository.isFamilyMember(USER_ID, MEMBER_ID)).thenReturn(true);
            when(userRepository.findById(MEMBER_ID)).thenReturn(Optional.of(member));
            when(locationRepository.findByUserId(MEMBER_ID)).thenReturn(List.of(location));

            ListFamilyMemberLocationHistoryRequest req =
                    ListFamilyMemberLocationHistoryRequest.newBuilder()
                            .setMemberId(MEMBER_ID.toString())
                            .build();

            ListFamilyMemberLocationHistoryResponse res = service.listFamilyMemberLocationHistory(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            assertEquals(1, res.getLocationsCount());
            verify(locationRepository).findByUserId(MEMBER_ID);
            verify(locationRepository, never()).findByUserIdAndWithinRadius(any(), anyDouble(), anyDouble(), anyFloat());
        }

        @Test
        void should_returnHistory_withSpatialFilter_whenAllFieldsPresent() {
            User member = buildUser(MEMBER_ID);
            Location location = buildLocation(MEMBER_ID);

            when(userRepository.isFamilyMember(USER_ID, MEMBER_ID)).thenReturn(true);
            when(userRepository.findById(MEMBER_ID)).thenReturn(Optional.of(member));
            when(locationRepository.findByUserIdAndWithinRadius(eq(MEMBER_ID), anyDouble(), anyDouble(), anyFloat()))
                    .thenReturn(List.of(location));

            ListFamilyMemberLocationHistoryRequest req =
                    ListFamilyMemberLocationHistoryRequest.newBuilder()
                            .setMemberId(MEMBER_ID.toString())
                            .setCenterLatitudeDeg(21.0)
                            .setCenterLongitudeDeg(105.0)
                            .setRadiusMeter(500.0f)
                            .build();

            ListFamilyMemberLocationHistoryResponse res = service.listFamilyMemberLocationHistory(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            assertEquals(1, res.getLocationsCount());
            verify(locationRepository).findByUserIdAndWithinRadius(eq(MEMBER_ID), anyDouble(), anyDouble(), anyFloat());
            verify(locationRepository, never()).findByUserId(any());
        }

        @Test
        void should_useNoFilter_whenOnlyPartialSpatialParamsSet() {
            // Only lat set, not lon and radius — falls back to no-filter query
            User member = buildUser(MEMBER_ID);
            Location location = buildLocation(MEMBER_ID);

            when(userRepository.isFamilyMember(USER_ID, MEMBER_ID)).thenReturn(true);
            when(userRepository.findById(MEMBER_ID)).thenReturn(Optional.of(member));
            when(locationRepository.findByUserId(MEMBER_ID)).thenReturn(List.of(location));

            ListFamilyMemberLocationHistoryRequest req =
                    ListFamilyMemberLocationHistoryRequest.newBuilder()
                            .setMemberId(MEMBER_ID.toString())
                            .setCenterLatitudeDeg(21.0) // only lat, no lon/radius
                            .build();

            service.listFamilyMemberLocationHistory(USER_ID, req);

            verify(locationRepository).findByUserId(MEMBER_ID);
        }

        @Test
        void should_returnPermissionDenied_whenNotFamilyMember() {
            when(userRepository.isFamilyMember(USER_ID, MEMBER_ID)).thenReturn(false);

            ListFamilyMemberLocationHistoryRequest req =
                    ListFamilyMemberLocationHistoryRequest.newBuilder()
                            .setMemberId(MEMBER_ID.toString())
                            .build();

            ListFamilyMemberLocationHistoryResponse res = service.listFamilyMemberLocationHistory(USER_ID, req);

            assertEquals(Code.PERMISSION_DENIED_VALUE, res.getStatus().getCode());
            verify(locationRepository, never()).findByUserId(any());
        }

        @Test
        void should_throwRuntimeException_whenMemberNotFound() {
            when(userRepository.isFamilyMember(USER_ID, MEMBER_ID)).thenReturn(true);
            when(userRepository.findById(MEMBER_ID)).thenReturn(Optional.empty());

            ListFamilyMemberLocationHistoryRequest req =
                    ListFamilyMemberLocationHistoryRequest.newBuilder()
                            .setMemberId(MEMBER_ID.toString())
                            .build();

            assertThrows(RuntimeException.class,
                    () -> service.listFamilyMemberLocationHistory(USER_ID, req));
        }
    }
}
