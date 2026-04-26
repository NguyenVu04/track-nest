package project.tracknest.usertracking.controller;

import com.google.rpc.Code;
import com.google.rpc.Status;
import io.grpc.stub.ServerCallStreamObserver;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import project.tracknest.usertracking.domain.tracker.locationcommand.service.LocationCommandService;
import project.tracknest.usertracking.domain.tracker.locationquery.service.LocationQueryService;
import project.tracknest.usertracking.domain.tracker.locationquery.service.LocationStreamObserverRegistry;
import project.tracknest.usertracking.proto.lib.*;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static project.tracknest.usertracking.utils.SecuritySetup.*;

@ExtendWith(MockitoExtension.class)
class TrackerControllerTest {

    @Mock
    private LocationQueryService queryService;

    @Mock
    private LocationCommandService commandService;

    @Mock
    private LocationStreamObserverRegistry registry;

    @InjectMocks
    private TrackerController controller;

    @BeforeEach
    void setUp() {
        setUpSecurityContext();
    }

    // ==================== StreamFamilyMemberLocations Tests ====================

    @Nested
    @DisplayName("StreamFamilyMemberLocations Tests")
    class StreamFamilyMemberLocationsTests {

        @Test
        @DisplayName("Should stream initial locations and register observer")
        void shouldStreamFamilyMemberLocations_andRegisterObserver() {
            StreamFamilyMemberLocationsRequest request = StreamFamilyMemberLocationsRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .build();

            FamilyMemberLocation loc = FamilyMemberLocation.newBuilder()
                    .setMemberId(USER1_ID.toString())
                    .setLatitudeDeg(21.0)
                    .setLongitudeDeg(105.0)
                    .build();

            when(queryService.streamFamilyMemberLocations(eq(ADMIN_USER_ID), eq(request)))
                    .thenReturn(List.of(loc));
            when(registry.register(any(), any(), any())).thenReturn("session-1");

            @SuppressWarnings("unchecked")
            ServerCallStreamObserver<FamilyMemberLocation> obs = mock(ServerCallStreamObserver.class);

            controller.streamFamilyMemberLocations(request, obs);

            verify(obs).disableAutoRequest();
            verify(obs).onNext(loc);
            verify(registry).register(eq(ADMIN_USER_ID), eq(UUID.fromString(ADMIN_CIRCLE_ID)), eq(obs));
            verify(obs).setOnCancelHandler(any(Runnable.class));
        }

        @Test
        @DisplayName("Should not call onNext when service returns empty list")
        void shouldStreamFamilyMemberLocations_emptyList() {
            StreamFamilyMemberLocationsRequest request = StreamFamilyMemberLocationsRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .build();

            when(queryService.streamFamilyMemberLocations(any(), any())).thenReturn(List.of());
            when(registry.register(any(), any(), any())).thenReturn("session-1");

            @SuppressWarnings("unchecked")
            ServerCallStreamObserver<FamilyMemberLocation> obs = mock(ServerCallStreamObserver.class);

            controller.streamFamilyMemberLocations(request, obs);

            verify(obs).disableAutoRequest();
            verify(obs, never()).onNext(any());
            verify(registry).register(any(), any(), any());
        }

        @Test
        @DisplayName("Should handle cancel handler and unregister")
        void shouldHandleOnCancelCallback() {
            StreamFamilyMemberLocationsRequest request = StreamFamilyMemberLocationsRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .build();

            String sessionId = "cancel-session-id";
            when(queryService.streamFamilyMemberLocations(any(), any())).thenReturn(List.of());
            when(registry.register(any(), any(), any())).thenReturn(sessionId);

            @SuppressWarnings("unchecked")
            ServerCallStreamObserver<FamilyMemberLocation> obs = mock(ServerCallStreamObserver.class);

            ArgumentCaptor<Runnable> cancelCaptor = ArgumentCaptor.forClass(Runnable.class);
            controller.streamFamilyMemberLocations(request, obs);
            verify(obs).setOnCancelHandler(cancelCaptor.capture());

            cancelCaptor.getValue().run();

            verify(registry).unregister(eq(sessionId), eq(obs));
        }

        @Test
        @DisplayName("Should stream multiple locations for user with multiple circles")
        void shouldStreamLocations_forUserWithMultipleCircles() {
            setUpSecurityContext(USER1_ID, "user1", "user1@gmail.com");

            StreamFamilyMemberLocationsRequest request = StreamFamilyMemberLocationsRequest.newBuilder()
                    .setFamilyCircleId(FAMILY_CIRCLE_1_ID)
                    .build();

            FamilyMemberLocation loc1 = FamilyMemberLocation.newBuilder().setMemberId(USER2_ID.toString()).build();
            FamilyMemberLocation loc2 = FamilyMemberLocation.newBuilder().setMemberId(USER3_ID.toString()).build();

            when(queryService.streamFamilyMemberLocations(eq(USER1_ID), eq(request)))
                    .thenReturn(List.of(loc1, loc2));
            when(registry.register(any(), any(), any())).thenReturn("session-2");

            @SuppressWarnings("unchecked")
            ServerCallStreamObserver<FamilyMemberLocation> obs = mock(ServerCallStreamObserver.class);

            controller.streamFamilyMemberLocations(request, obs);

            verify(obs, times(2)).onNext(any());
            verify(obs).onNext(loc1);
            verify(obs).onNext(loc2);
        }
    }

    // ==================== ListFamilyMemberLocationHistory Tests ====================

    @Nested
    @DisplayName("ListFamilyMemberLocationHistory Tests")
    class ListFamilyMemberLocationHistoryTests {

        @Test
        @DisplayName("Should return location history without spatial filter")
        void shouldReturnLocationHistory_withoutSpatialFilter() {
            ListFamilyMemberLocationHistoryRequest request =
                    ListFamilyMemberLocationHistoryRequest.newBuilder()
                            .setMemberId(USER1_ID.toString())
                            .build();

            ListFamilyMemberLocationHistoryResponse expected =
                    ListFamilyMemberLocationHistoryResponse.newBuilder()
                            .setStatus(Status.newBuilder().setCode(Code.OK_VALUE).build())
                            .build();

            when(queryService.listFamilyMemberLocationHistory(ADMIN_USER_ID, request)).thenReturn(expected);

            @SuppressWarnings("unchecked")
            StreamObserver<ListFamilyMemberLocationHistoryResponse> obs = mock(StreamObserver.class);

            controller.listFamilyMemberLocationHistory(request, obs);

            verify(obs).onNext(expected);
            verify(obs).onCompleted();
            verify(obs, never()).onError(any());
        }

        @Test
        @DisplayName("Should return permission denied for non-family member")
        void shouldReturnPermissionDenied_forNonFamilyMember() {
            ListFamilyMemberLocationHistoryRequest request =
                    ListFamilyMemberLocationHistoryRequest.newBuilder()
                            .setMemberId(USER4_ID.toString())
                            .build();

            ListFamilyMemberLocationHistoryResponse denied =
                    ListFamilyMemberLocationHistoryResponse.newBuilder()
                            .setStatus(Status.newBuilder().setCode(Code.PERMISSION_DENIED_VALUE).build())
                            .build();

            when(queryService.listFamilyMemberLocationHistory(ADMIN_USER_ID, request)).thenReturn(denied);

            @SuppressWarnings("unchecked")
            StreamObserver<ListFamilyMemberLocationHistoryResponse> obs = mock(StreamObserver.class);

            controller.listFamilyMemberLocationHistory(request, obs);

            ArgumentCaptor<ListFamilyMemberLocationHistoryResponse> captor =
                    ArgumentCaptor.forClass(ListFamilyMemberLocationHistoryResponse.class);
            verify(obs).onNext(captor.capture());
            assertEquals(Code.PERMISSION_DENIED_VALUE, captor.getValue().getStatus().getCode());
            verify(obs).onCompleted();
        }

        @Test
        @DisplayName("Should return location history with spatial filter")
        void shouldReturnLocationHistory_withSpatialFilter() {
            ListFamilyMemberLocationHistoryRequest request =
                    ListFamilyMemberLocationHistoryRequest.newBuilder()
                            .setMemberId(USER1_ID.toString())
                            .setCenterLatitudeDeg(21.0)
                            .setCenterLongitudeDeg(105.0)
                            .setRadiusMeter(500.0f)
                            .build();

            ListFamilyMemberLocationHistoryResponse expected =
                    ListFamilyMemberLocationHistoryResponse.newBuilder()
                            .setStatus(Status.newBuilder().setCode(Code.OK_VALUE).build())
                            .build();

            when(queryService.listFamilyMemberLocationHistory(ADMIN_USER_ID, request)).thenReturn(expected);

            @SuppressWarnings("unchecked")
            StreamObserver<ListFamilyMemberLocationHistoryResponse> obs = mock(StreamObserver.class);

            controller.listFamilyMemberLocationHistory(request, obs);

            verify(obs).onNext(expected);
            verify(obs).onCompleted();
        }
    }

    // ==================== UpdateUserLocation Tests ====================

    @Nested
    @DisplayName("UpdateUserLocation Tests")
    class UpdateUserLocationTests {

        @Test
        @DisplayName("Should update location successfully")
        void shouldUpdateUserLocation_success() {
            UpdateUserLocationRequest request = UpdateUserLocationRequest.newBuilder()
                    .addLocations(UserLocation.newBuilder()
                            .setLatitudeDeg(21.0)
                            .setLongitudeDeg(105.0)
                            .setTimestampMs(System.currentTimeMillis())
                            .setAccuracyMeter(10.0f)
                            .setVelocityMps(0.0f)
                            .build())
                    .build();

            UpdateUserLocationResponse expected = UpdateUserLocationResponse.newBuilder()
                    .setStatus(Status.newBuilder().setCode(Code.OK_VALUE).build())
                    .build();

            when(commandService.updateUserLocation(ADMIN_USER_ID, request)).thenReturn(expected);

            @SuppressWarnings("unchecked")
            StreamObserver<UpdateUserLocationResponse> obs = mock(StreamObserver.class);

            controller.updateUserLocation(request, obs);

            verify(obs).onNext(expected);
            verify(obs).onCompleted();
            verify(obs, never()).onError(any());
        }

        @Test
        @DisplayName("Should update location for user1")
        void shouldUpdateLocation_forUser1() {
            setUpSecurityContext(USER1_ID, "user1", "user1@gmail.com");

            UpdateUserLocationRequest request = UpdateUserLocationRequest.newBuilder()
                    .addLocations(UserLocation.newBuilder()
                            .setLatitudeDeg(10.5)
                            .setLongitudeDeg(100.5)
                            .setTimestampMs(System.currentTimeMillis())
                            .setAccuracyMeter(5.0f)
                            .setVelocityMps(1.5f)
                            .build())
                    .build();

            UpdateUserLocationResponse expected = UpdateUserLocationResponse.newBuilder()
                    .setStatus(Status.newBuilder().setCode(Code.OK_VALUE).build())
                    .build();

            when(commandService.updateUserLocation(USER1_ID, request)).thenReturn(expected);

            @SuppressWarnings("unchecked")
            StreamObserver<UpdateUserLocationResponse> obs = mock(StreamObserver.class);

            controller.updateUserLocation(request, obs);

            verify(obs).onNext(expected);
            verify(obs).onCompleted();
        }

        @Test
        @DisplayName("Should update location with zero velocity")
        void shouldUpdateLocation_withZeroVelocity() {
            UpdateUserLocationRequest request = UpdateUserLocationRequest.newBuilder()
                    .addLocations(UserLocation.newBuilder()
                            .setLatitudeDeg(0.0)
                            .setLongitudeDeg(0.0)
                            .setTimestampMs(System.currentTimeMillis())
                            .setAccuracyMeter(0.0f)
                            .setVelocityMps(0.0f)
                            .build())
                    .build();

            UpdateUserLocationResponse expected = UpdateUserLocationResponse.newBuilder()
                    .setStatus(Status.newBuilder().setCode(Code.OK_VALUE).build())
                    .build();

            when(commandService.updateUserLocation(ADMIN_USER_ID, request)).thenReturn(expected);

            @SuppressWarnings("unchecked")
            StreamObserver<UpdateUserLocationResponse> obs = mock(StreamObserver.class);

            controller.updateUserLocation(request, obs);

            verify(obs).onNext(expected);
            verify(obs).onCompleted();
        }
    }
}
