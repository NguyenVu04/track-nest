package project.tracknest.emergencyops.domain.emergencyrequestmanager.impl;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import project.tracknest.emergencyops.configuration.security.KeycloakService;
import project.tracknest.emergencyops.configuration.security.datatype.KeycloakUserProfile;
import project.tracknest.emergencyops.core.entity.EmergencyRequest;
import project.tracknest.emergencyops.core.entity.EmergencyRequestStatus;
import project.tracknest.emergencyops.core.entity.EmergencyService;
import project.tracknest.emergencyops.core.entity.EmergencyServiceUser;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmergencyRequestManagerServiceImplTest {

    @Mock
    private EmergencyRequestManagerEmergencyRequestRepository emergencyRequestRepository;
    @Mock
    private EmergencyRequestManagerEmergencyRequestStatusRepository emergencyRequestStatusRepository;
    @Mock
    private EmergencyRequestManagerEmergencyServiceUserRepository emergencyServiceUserRepository;
    @Mock
    private EmergencyServiceManagerEmergencyServiceRepository emergencyServiceRepository;
    @Mock
    private KeycloakService keycloakService;

    @InjectMocks
    private EmergencyRequestManagerServiceImpl service;

    private static final UUID SERVICE_ID = UUID.randomUUID();
    private static final UUID REQUEST_ID = UUID.randomUUID();
    private static final UUID SENDER_ID = UUID.randomUUID();
    private static final UUID TARGET_ID = UUID.randomUUID();

    private EmergencyService mockEmergencyService() {
        return EmergencyService.builder()
                .id(SERVICE_ID)
                .username("Service A")
                .phoneNumber("+84123456789")
                .latitude(10.0)
                .longitude(106.0)
                .updatedAt(OffsetDateTime.now())
                .build();
    }

    private EmergencyRequestStatus status(EmergencyRequestStatus.Status s) {
        return new EmergencyRequestStatus(s.getValue());
    }

    private EmergencyRequest mockRequest(EmergencyRequestStatus st) {
        return EmergencyRequest.builder()
                .id(REQUEST_ID)
                .senderId(SENDER_ID)
                .targetId(TARGET_ID)
                .latitude(10.0)
                .longitude(106.0)
                .status(st)
                .emergencyService(mockEmergencyService())
                .openAt(OffsetDateTime.now())
                .build();
    }

    private KeycloakUserProfile mockProfile(UUID id) {
        return new KeycloakUserProfile(id, "user_" + id, "u@mail.com", "First", "Last", "http://avatar", "+1");
    }

    @Nested
    @DisplayName("getEmergencyRequestCount")
    class GetEmergencyRequestCount {

        @Test
        @DisplayName("should_returnCount_givenStatus")
        void should_returnCount_givenStatus() {
            when(emergencyRequestRepository.countEmergencyRequests(SERVICE_ID, "PENDING")).thenReturn(3L);

            var result = service.getEmergencyRequestCount(SERVICE_ID, EmergencyRequestStatus.Status.PENDING);

            assertNotNull(result);
            assertEquals(3L, result.count());
            assertTrue(result.timestampMs() > 0);
        }

        @Test
        @DisplayName("should_returnCount_whenStatusIsNull")
        void should_returnCount_whenStatusIsNull() {
            when(emergencyRequestRepository.countEmergencyRequests(SERVICE_ID, null)).thenReturn(10L);

            var result = service.getEmergencyRequestCount(SERVICE_ID, null);

            assertEquals(10L, result.count());
        }
    }

    @Nested
    @DisplayName("getEmergencyRequests")
    class GetEmergencyRequests {

        @Test
        @DisplayName("should_returnPageOfRequests_withProfilesEnriched")
        void should_returnPageOfRequests_withProfilesEnriched() {
            Pageable pageable = PageRequest.of(0, 10);
            EmergencyRequest req = mockRequest(status(EmergencyRequestStatus.Status.PENDING));
            Page<EmergencyRequest> page = new PageImpl<>(List.of(req), pageable, 1);

            when(emergencyRequestRepository.findServiceEmergencyRequests(SERVICE_ID, "PENDING", pageable))
                    .thenReturn(page);
            when(keycloakService.getUserProfile(SENDER_ID)).thenReturn(mockProfile(SENDER_ID));
            when(keycloakService.getUserProfile(TARGET_ID)).thenReturn(mockProfile(TARGET_ID));

            var result = service.getEmergencyRequests(SERVICE_ID, EmergencyRequestStatus.Status.PENDING, pageable);

            assertNotNull(result);
            assertEquals(1, result.items().size());
            assertEquals(1L, result.totalItems());
            var item = result.items().getFirst();
            assertEquals(REQUEST_ID, item.id());
            assertEquals(SENDER_ID, item.senderId());
            assertEquals(TARGET_ID, item.targetId());
            assertEquals("PENDING", item.status());
        }

        @Test
        @DisplayName("should_returnEmptyPage_whenNoRequests")
        void should_returnEmptyPage_whenNoRequests() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<EmergencyRequest> emptyPage = new PageImpl<>(List.of(), pageable, 0);

            when(emergencyRequestRepository.findServiceEmergencyRequests(any(), any(), any()))
                    .thenReturn(emptyPage);

            var result = service.getEmergencyRequests(SERVICE_ID, null, pageable);

            assertTrue(result.items().isEmpty());
            assertEquals(0L, result.totalItems());
        }
    }

    @Nested
    @DisplayName("acceptEmergencyRequest")
    class AcceptEmergencyRequest {

        @Test
        @DisplayName("should_acceptRequest_whenRequestIsPending")
        void should_acceptRequest_whenRequestIsPending() {
            EmergencyRequest req = mockRequest(status(EmergencyRequestStatus.Status.PENDING));
            when(emergencyRequestRepository.findByIdAndEmergencyService_Id(REQUEST_ID, SERVICE_ID))
                    .thenReturn(Optional.of(req));
            when(emergencyRequestStatusRepository.findById(EmergencyRequestStatus.Status.ACCEPTED.getValue()))
                    .thenReturn(Optional.of(status(EmergencyRequestStatus.Status.ACCEPTED)));
            when(emergencyRequestRepository.save(any())).thenReturn(req);
            when(emergencyServiceUserRepository.save(any())).thenReturn(new EmergencyServiceUser());

            var result = service.acceptEmergencyRequest(SERVICE_ID, REQUEST_ID);

            assertNotNull(result);
            assertEquals(REQUEST_ID, result.id());
            assertTrue(result.acceptedAtMs() > 0);
            verify(emergencyRequestRepository).save(req);
            verify(emergencyServiceUserRepository).save(any());
        }

        @Test
        @DisplayName("should_throwIllegalArgument_whenRequestNotFound")
        void should_throwIllegalArgument_whenRequestNotFound() {
            when(emergencyRequestRepository.findByIdAndEmergencyService_Id(any(), any()))
                    .thenReturn(Optional.empty());

            assertThrows(IllegalArgumentException.class,
                    () -> service.acceptEmergencyRequest(SERVICE_ID, REQUEST_ID));
        }

        @Test
        @DisplayName("should_throwIllegalArgument_whenRequestNotPending")
        void should_throwIllegalArgument_whenRequestNotPending() {
            EmergencyRequest req = mockRequest(status(EmergencyRequestStatus.Status.ACCEPTED));
            when(emergencyRequestRepository.findByIdAndEmergencyService_Id(any(), any()))
                    .thenReturn(Optional.of(req));

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> service.acceptEmergencyRequest(SERVICE_ID, REQUEST_ID));
            assertTrue(ex.getMessage().contains("PENDING"));
        }

        @Test
        @DisplayName("should_throwIllegalState_whenAcceptedStatusMissingFromDatabase")
        void should_throwIllegalState_whenAcceptedStatusMissingFromDatabase() {
            EmergencyRequest req = mockRequest(status(EmergencyRequestStatus.Status.PENDING));
            when(emergencyRequestRepository.findByIdAndEmergencyService_Id(any(), any()))
                    .thenReturn(Optional.of(req));
            when(emergencyRequestStatusRepository.findById(anyString())).thenReturn(Optional.empty());

            assertThrows(IllegalStateException.class,
                    () -> service.acceptEmergencyRequest(SERVICE_ID, REQUEST_ID));
        }
    }

    @Nested
    @DisplayName("rejectEmergencyRequest")
    class RejectEmergencyRequest {

        @Test
        @DisplayName("should_rejectRequest_whenRequestIsPending")
        void should_rejectRequest_whenRequestIsPending() {
            EmergencyRequest req = mockRequest(status(EmergencyRequestStatus.Status.PENDING));
            when(emergencyRequestRepository.findByIdAndEmergencyService_Id(REQUEST_ID, SERVICE_ID))
                    .thenReturn(Optional.of(req));
            when(emergencyRequestStatusRepository.findById(EmergencyRequestStatus.Status.REJECTED.getValue()))
                    .thenReturn(Optional.of(status(EmergencyRequestStatus.Status.REJECTED)));
            when(emergencyRequestRepository.save(any())).thenReturn(req);

            var result = service.rejectEmergencyRequest(SERVICE_ID, REQUEST_ID);

            assertNotNull(result);
            assertEquals(REQUEST_ID, result.id());
            assertTrue(result.rejectedAtMs() > 0);
            verify(emergencyRequestRepository).save(req);
        }

        @Test
        @DisplayName("should_throwIllegalArgument_whenRequestNotFound")
        void should_throwIllegalArgument_whenRequestNotFound() {
            when(emergencyRequestRepository.findByIdAndEmergencyService_Id(any(), any()))
                    .thenReturn(Optional.empty());

            assertThrows(IllegalArgumentException.class,
                    () -> service.rejectEmergencyRequest(SERVICE_ID, REQUEST_ID));
        }

        @Test
        @DisplayName("should_throwIllegalArgument_whenRequestNotPending")
        void should_throwIllegalArgument_whenRequestNotPending() {
            EmergencyRequest req = mockRequest(status(EmergencyRequestStatus.Status.ACCEPTED));
            when(emergencyRequestRepository.findByIdAndEmergencyService_Id(any(), any()))
                    .thenReturn(Optional.of(req));

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> service.rejectEmergencyRequest(SERVICE_ID, REQUEST_ID));
            assertTrue(ex.getMessage().contains("PENDING"));
        }

        @Test
        @DisplayName("should_throwIllegalState_whenRejectedStatusMissingFromDatabase")
        void should_throwIllegalState_whenRejectedStatusMissingFromDatabase() {
            EmergencyRequest req = mockRequest(status(EmergencyRequestStatus.Status.PENDING));
            when(emergencyRequestRepository.findByIdAndEmergencyService_Id(any(), any()))
                    .thenReturn(Optional.of(req));
            when(emergencyRequestStatusRepository.findById(anyString())).thenReturn(Optional.empty());

            assertThrows(IllegalStateException.class,
                    () -> service.rejectEmergencyRequest(SERVICE_ID, REQUEST_ID));
        }
    }

    @Nested
    @DisplayName("closeEmergencyRequest")
    class CloseEmergencyRequest {

        @Test
        @DisplayName("should_closeRequest_andDeleteTrackedUser_whenUserIsTracked")
        void should_closeRequest_andDeleteTrackedUser_whenUserIsTracked() {
            EmergencyRequest req = mockRequest(status(EmergencyRequestStatus.Status.ACCEPTED));
            EmergencyServiceUser trackedUser = EmergencyServiceUser.builder()
                    .userId(TARGET_ID)
                    .emergencyService(mockEmergencyService())
                    .lastLatitude(10.0)
                    .lastLongitude(106.0)
                    .lastUpdateTime(OffsetDateTime.now())
                    .build();

            when(emergencyRequestRepository.findByIdAndEmergencyService_Id(REQUEST_ID, SERVICE_ID))
                    .thenReturn(Optional.of(req));
            when(emergencyRequestStatusRepository.findById(EmergencyRequestStatus.Status.CLOSED.getValue()))
                    .thenReturn(Optional.of(status(EmergencyRequestStatus.Status.CLOSED)));
            when(emergencyRequestRepository.save(any())).thenReturn(req);
            when(emergencyServiceUserRepository.findByEmergencyService_IdAndUserId(SERVICE_ID, TARGET_ID))
                    .thenReturn(Optional.of(trackedUser));

            var result = service.closeEmergencyRequest(SERVICE_ID, REQUEST_ID);

            assertNotNull(result);
            assertEquals(REQUEST_ID, result.id());
            assertTrue(result.closedAtMs() > 0);
            verify(emergencyServiceUserRepository).delete(trackedUser);
        }

        @Test
        @DisplayName("should_closeRequest_withoutError_whenUserNotTracked")
        void should_closeRequest_withoutError_whenUserNotTracked() {
            EmergencyRequest req = mockRequest(status(EmergencyRequestStatus.Status.ACCEPTED));

            when(emergencyRequestRepository.findByIdAndEmergencyService_Id(REQUEST_ID, SERVICE_ID))
                    .thenReturn(Optional.of(req));
            when(emergencyRequestStatusRepository.findById(EmergencyRequestStatus.Status.CLOSED.getValue()))
                    .thenReturn(Optional.of(status(EmergencyRequestStatus.Status.CLOSED)));
            when(emergencyRequestRepository.save(any())).thenReturn(req);
            when(emergencyServiceUserRepository.findByEmergencyService_IdAndUserId(any(), any()))
                    .thenReturn(Optional.empty());

            var result = service.closeEmergencyRequest(SERVICE_ID, REQUEST_ID);

            assertNotNull(result);
            verify(emergencyServiceUserRepository, never()).delete(any());
        }

        @Test
        @DisplayName("should_throwIllegalArgument_whenRequestNotFound")
        void should_throwIllegalArgument_whenRequestNotFound() {
            when(emergencyRequestRepository.findByIdAndEmergencyService_Id(any(), any()))
                    .thenReturn(Optional.empty());

            assertThrows(IllegalArgumentException.class,
                    () -> service.closeEmergencyRequest(SERVICE_ID, REQUEST_ID));
        }

        @Test
        @DisplayName("should_throwIllegalArgument_whenRequestNotAccepted")
        void should_throwIllegalArgument_whenRequestNotAccepted() {
            EmergencyRequest req = mockRequest(status(EmergencyRequestStatus.Status.PENDING));
            when(emergencyRequestRepository.findByIdAndEmergencyService_Id(any(), any()))
                    .thenReturn(Optional.of(req));

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> service.closeEmergencyRequest(SERVICE_ID, REQUEST_ID));
            assertTrue(ex.getMessage().contains("ACCEPTED"));
        }

        @Test
        @DisplayName("should_throwIllegalState_whenClosedStatusMissingFromDatabase")
        void should_throwIllegalState_whenClosedStatusMissingFromDatabase() {
            EmergencyRequest req = mockRequest(status(EmergencyRequestStatus.Status.ACCEPTED));
            when(emergencyRequestRepository.findByIdAndEmergencyService_Id(any(), any()))
                    .thenReturn(Optional.of(req));
            when(emergencyRequestStatusRepository.findById(anyString())).thenReturn(Optional.empty());

            assertThrows(IllegalStateException.class,
                    () -> service.closeEmergencyRequest(SERVICE_ID, REQUEST_ID));
        }
    }

    @Nested
    @DisplayName("updateEmergencyServiceLocation")
    class UpdateEmergencyServiceLocation {

        @Test
        @DisplayName("should_updateLocation_whenServiceFound")
        void should_updateLocation_whenServiceFound() {
            EmergencyService es = mockEmergencyService();
            PatchEmergencyServiceLocationRequest request = PatchEmergencyServiceLocationRequest.builder()
                    .latitudeDegrees(21.0)
                    .longitudeDegrees(105.0)
                    .build();

            when(emergencyServiceRepository.findById(SERVICE_ID)).thenReturn(Optional.of(es));
            when(emergencyServiceRepository.save(es)).thenReturn(es);

            var result = service.updateEmergencyServiceLocation(SERVICE_ID, request);

            assertNotNull(result);
            assertEquals(SERVICE_ID, result.id());
            assertTrue(result.updatedAtMs() > 0);
            assertEquals(105.0, es.getLongitude());
            assertEquals(21.0, es.getLatitude());
            verify(emergencyServiceRepository).save(es);
        }

        @Test
        @DisplayName("should_throwIllegalArgument_whenServiceNotFound")
        void should_throwIllegalArgument_whenServiceNotFound() {
            when(emergencyServiceRepository.findById(any())).thenReturn(Optional.empty());

            assertThrows(IllegalArgumentException.class,
                    () -> service.updateEmergencyServiceLocation(SERVICE_ID,
                            PatchEmergencyServiceLocationRequest.builder().latitudeDegrees(10.0).longitudeDegrees(106.0).build()));
        }
    }

    @Nested
    @DisplayName("getEmergencyServiceLocation")
    class GetEmergencyServiceLocation {

        @Test
        @DisplayName("should_returnLocation_whenServiceFound")
        void should_returnLocation_whenServiceFound() {
            EmergencyService es = mockEmergencyService();
            when(emergencyServiceRepository.findById(SERVICE_ID)).thenReturn(Optional.of(es));

            var result = service.getEmergencyServiceLocation(SERVICE_ID);

            assertNotNull(result);
            assertEquals(10.0, result.latitude());
            assertEquals(106.0, result.longitude());
            assertNotNull(result.updatedAtMs());
        }

        @Test
        @DisplayName("should_returnNullUpdatedAt_whenServiceNeverUpdated")
        void should_returnNullUpdatedAt_whenServiceNeverUpdated() {
            EmergencyService es = EmergencyService.builder()
                    .id(SERVICE_ID).username("svc").phoneNumber("+1")
                    .latitude(0.0).longitude(0.0).updatedAt(null).build();
            when(emergencyServiceRepository.findById(SERVICE_ID)).thenReturn(Optional.of(es));

            var result = service.getEmergencyServiceLocation(SERVICE_ID);

            assertNull(result.updatedAtMs());
        }

        @Test
        @DisplayName("should_throwIllegalArgument_whenServiceNotFound")
        void should_throwIllegalArgument_whenServiceNotFound() {
            when(emergencyServiceRepository.findById(any())).thenReturn(Optional.empty());

            assertThrows(IllegalArgumentException.class,
                    () -> service.getEmergencyServiceLocation(SERVICE_ID));
        }
    }
}
