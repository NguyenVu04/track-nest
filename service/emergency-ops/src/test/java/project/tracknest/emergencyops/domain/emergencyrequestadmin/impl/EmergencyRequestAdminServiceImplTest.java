package project.tracknest.emergencyops.domain.emergencyrequestadmin.impl;

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
import project.tracknest.emergencyops.configuration.security.datatype.KeycloakEmergencyServiceProfile;
import project.tracknest.emergencyops.configuration.security.datatype.KeycloakUserProfile;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.core.entity.EmergencyRequest;
import project.tracknest.emergencyops.core.entity.EmergencyRequestStatus;
import project.tracknest.emergencyops.core.entity.EmergencyService;
import project.tracknest.emergencyops.domain.emergencyrequestadmin.impl.datatype.GetEmergencyRequestsResponse;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmergencyRequestAdminServiceImplTest {

    @Mock
    private EmergencyRequestAdminEmergencyRequestRepository emergencyRequestRepository;
    @Mock
    private KeycloakService keycloakService;

    @InjectMocks
    private EmergencyRequestAdminServiceImpl service;

    private static final UUID SENDER_ID = UUID.randomUUID();
    private static final UUID TARGET_ID = UUID.randomUUID();
    private static final UUID SERVICE_ID = UUID.randomUUID();
    private static final UUID REQUEST_ID = UUID.randomUUID();

    private EmergencyService mockService() {
        return EmergencyService.builder()
                .id(SERVICE_ID)
                .username("service-user")
                .phoneNumber("+84123456789")
                .build();
    }

    private EmergencyRequest mockRequest(EmergencyRequestStatus.Status statusEnum) {
        EmergencyRequestStatus status = new EmergencyRequestStatus(statusEnum.getValue());
        return EmergencyRequest.builder()
                .id(REQUEST_ID)
                .senderId(SENDER_ID)
                .targetId(TARGET_ID)
                .latitude(10.5)
                .longitude(106.7)
                .status(status)
                .emergencyService(mockService())
                .openAt(OffsetDateTime.now().minusHours(1))
                .build();
    }

    private KeycloakUserProfile userProfile(UUID id, String username) {
        return new KeycloakUserProfile(id, username, username + "@example.com", "First", "Last", null, "+84999");
    }

    private KeycloakEmergencyServiceProfile serviceProfile() {
        return new KeycloakEmergencyServiceProfile(SERVICE_ID, "service-user", "svc@example.com", "Svc", "Team", "+84000");
    }

    @Nested
    @DisplayName("getEmergencyRequests")
    class GetEmergencyRequests {

        @Test
        @DisplayName("should_returnPagedResponse_whenRequestsExist")
        void should_returnPagedResponse_whenRequestsExist() {
            Pageable pageable = PageRequest.of(0, 10);
            EmergencyRequest request = mockRequest(EmergencyRequestStatus.Status.PENDING);
            Page<EmergencyRequest> repoPage = new PageImpl<>(List.of(request), pageable, 1);

            when(emergencyRequestRepository.findAllEmergencyRequests(eq("PENDING"), eq(pageable)))
                    .thenReturn(repoPage);
            when(keycloakService.getUserProfile(SENDER_ID)).thenReturn(userProfile(SENDER_ID, "sender"));
            when(keycloakService.getUserProfile(TARGET_ID)).thenReturn(userProfile(TARGET_ID, "target"));
            when(keycloakService.getEmergencyServiceProfile(SERVICE_ID)).thenReturn(serviceProfile());

            PageResponse<GetEmergencyRequestsResponse> result =
                    service.getEmergencyRequests(EmergencyRequestStatus.Status.PENDING, pageable);

            assertNotNull(result);
            assertEquals(1, result.items().size());
            assertEquals(1L, result.totalItems());
            assertEquals(1, result.totalPages());
            assertEquals(0, result.currentPage());
        }

        @Test
        @DisplayName("should_passNullStatus_toRepository_whenStatusParamIsNull")
        void should_passNullStatus_toRepository_whenStatusParamIsNull() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<EmergencyRequest> repoPage = new PageImpl<>(List.of(), pageable, 0);

            when(emergencyRequestRepository.findAllEmergencyRequests(isNull(), eq(pageable)))
                    .thenReturn(repoPage);

            PageResponse<GetEmergencyRequestsResponse> result =
                    service.getEmergencyRequests(null, pageable);

            assertNotNull(result);
            assertEquals(0, result.items().size());
            verify(emergencyRequestRepository).findAllEmergencyRequests(null, pageable);
            verifyNoInteractions(keycloakService);
        }

        @Test
        @DisplayName("should_mapResponseFields_correctly")
        void should_mapResponseFields_correctly() {
            Pageable pageable = PageRequest.of(0, 10);
            OffsetDateTime openAt = OffsetDateTime.now().minusMinutes(30);
            EmergencyRequestStatus status = new EmergencyRequestStatus("PENDING");
            EmergencyRequest request = EmergencyRequest.builder()
                    .id(REQUEST_ID)
                    .senderId(SENDER_ID)
                    .targetId(TARGET_ID)
                    .latitude(10.5)
                    .longitude(106.7)
                    .status(status)
                    .emergencyService(mockService())
                    .openAt(openAt)
                    .closeAt(null)
                    .build();
            Page<EmergencyRequest> repoPage = new PageImpl<>(List.of(request), pageable, 1);

            when(emergencyRequestRepository.findAllEmergencyRequests(any(), any())).thenReturn(repoPage);
            when(keycloakService.getUserProfile(SENDER_ID)).thenReturn(userProfile(SENDER_ID, "sender"));
            when(keycloakService.getUserProfile(TARGET_ID)).thenReturn(userProfile(TARGET_ID, "target"));
            when(keycloakService.getEmergencyServiceProfile(SERVICE_ID)).thenReturn(serviceProfile());

            PageResponse<GetEmergencyRequestsResponse> result =
                    service.getEmergencyRequests(null, pageable);

            GetEmergencyRequestsResponse item = result.items().getFirst();
            assertEquals(REQUEST_ID, item.id());
            assertEquals(SENDER_ID, item.senderId());
            assertEquals("sender", item.senderUsername());
            assertEquals(TARGET_ID, item.targetId());
            assertEquals("target", item.targetUsername());
            assertEquals("PENDING", item.status());
            assertEquals(10.5, item.targetLastLatitude());
            assertEquals(106.7, item.targetLastLongitude());
            assertEquals(openAt.toInstant().toEpochMilli(), item.openedAt());
            assertNull(item.closedAt());
            assertEquals(SERVICE_ID, item.serviceId());
            assertEquals("service-user", item.serviceUsername());
            assertEquals("svc@example.com", item.serviceEmail());
        }

        @Test
        @DisplayName("should_setClosedAt_whenRequestIsClosed")
        void should_setClosedAt_whenRequestIsClosed() {
            Pageable pageable = PageRequest.of(0, 10);
            OffsetDateTime closeAt = OffsetDateTime.now();
            EmergencyRequest request = EmergencyRequest.builder()
                    .id(REQUEST_ID)
                    .senderId(SENDER_ID)
                    .targetId(TARGET_ID)
                    .latitude(0.0)
                    .longitude(0.0)
                    .status(new EmergencyRequestStatus("CLOSED"))
                    .emergencyService(mockService())
                    .openAt(OffsetDateTime.now().minusHours(2))
                    .closeAt(closeAt)
                    .build();
            Page<EmergencyRequest> repoPage = new PageImpl<>(List.of(request), pageable, 1);

            when(emergencyRequestRepository.findAllEmergencyRequests(any(), any())).thenReturn(repoPage);
            when(keycloakService.getUserProfile(any())).thenReturn(userProfile(SENDER_ID, "user"));
            when(keycloakService.getEmergencyServiceProfile(any())).thenReturn(serviceProfile());

            PageResponse<GetEmergencyRequestsResponse> result =
                    service.getEmergencyRequests(EmergencyRequestStatus.Status.CLOSED, pageable);

            assertNotNull(result.items().getFirst().closedAt());
            assertEquals(closeAt.toInstant().toEpochMilli(), result.items().getFirst().closedAt());
        }

        @Test
        @DisplayName("should_deduplicateUserIdsBefore_fetchingProfiles")
        void should_deduplicateUserIdsBefore_fetchingProfiles() {
            Pageable pageable = PageRequest.of(0, 10);
            UUID sharedUserId = UUID.randomUUID();
            EmergencyRequest r1 = EmergencyRequest.builder()
                    .id(UUID.randomUUID()).senderId(sharedUserId).targetId(sharedUserId)
                    .latitude(0.0).longitude(0.0)
                    .status(new EmergencyRequestStatus("PENDING"))
                    .emergencyService(mockService())
                    .openAt(OffsetDateTime.now())
                    .build();
            EmergencyRequest r2 = EmergencyRequest.builder()
                    .id(UUID.randomUUID()).senderId(sharedUserId).targetId(sharedUserId)
                    .latitude(0.0).longitude(0.0)
                    .status(new EmergencyRequestStatus("PENDING"))
                    .emergencyService(mockService())
                    .openAt(OffsetDateTime.now())
                    .build();
            Page<EmergencyRequest> repoPage = new PageImpl<>(List.of(r1, r2), pageable, 2);

            when(emergencyRequestRepository.findAllEmergencyRequests(any(), any())).thenReturn(repoPage);
            when(keycloakService.getUserProfile(sharedUserId)).thenReturn(userProfile(sharedUserId, "shared"));
            when(keycloakService.getEmergencyServiceProfile(SERVICE_ID)).thenReturn(serviceProfile());

            service.getEmergencyRequests(null, pageable);

            verify(keycloakService, times(1)).getUserProfile(sharedUserId);
            verify(keycloakService, times(1)).getEmergencyServiceProfile(SERVICE_ID);
        }

        @Test
        @DisplayName("should_returnEmptyPage_whenNoRequestsExist")
        void should_returnEmptyPage_whenNoRequestsExist() {
            Pageable pageable = PageRequest.of(2, 10);
            Page<EmergencyRequest> emptyPage = new PageImpl<>(List.of(), pageable, 0);

            when(emergencyRequestRepository.findAllEmergencyRequests(any(), any())).thenReturn(emptyPage);

            PageResponse<GetEmergencyRequestsResponse> result =
                    service.getEmergencyRequests(null, pageable);

            assertTrue(result.items().isEmpty());
            assertEquals(0L, result.totalItems());
            assertEquals(0, result.totalPages());
            verifyNoInteractions(keycloakService);
        }

        @Test
        @DisplayName("should_propagateException_whenKeycloakThrows")
        void should_propagateException_whenKeycloakThrows() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<EmergencyRequest> repoPage = new PageImpl<>(
                    List.of(mockRequest(EmergencyRequestStatus.Status.PENDING)), pageable, 1);

            when(emergencyRequestRepository.findAllEmergencyRequests(any(), any())).thenReturn(repoPage);
            when(keycloakService.getUserProfile(any())).thenThrow(new RuntimeException("Keycloak unreachable"));

            assertThrows(RuntimeException.class,
                    () -> service.getEmergencyRequests(null, pageable));
        }

        @Test
        @DisplayName("should_fetchServiceProfiles_fromRestrictedRealm_forEachUniqueService")
        void should_fetchServiceProfiles_fromRestrictedRealm_forEachUniqueService() {
            Pageable pageable = PageRequest.of(0, 10);
            UUID serviceId2 = UUID.randomUUID();
            EmergencyService service2 = EmergencyService.builder()
                    .id(serviceId2).username("service2").phoneNumber("+84000").build();

            EmergencyRequest r1 = EmergencyRequest.builder()
                    .id(UUID.randomUUID()).senderId(SENDER_ID).targetId(TARGET_ID)
                    .latitude(0.0).longitude(0.0)
                    .status(new EmergencyRequestStatus("PENDING"))
                    .emergencyService(mockService()).openAt(OffsetDateTime.now()).build();
            EmergencyRequest r2 = EmergencyRequest.builder()
                    .id(UUID.randomUUID()).senderId(SENDER_ID).targetId(TARGET_ID)
                    .latitude(0.0).longitude(0.0)
                    .status(new EmergencyRequestStatus("ACCEPTED"))
                    .emergencyService(service2).openAt(OffsetDateTime.now()).build();

            Page<EmergencyRequest> repoPage = new PageImpl<>(List.of(r1, r2), pageable, 2);
            when(emergencyRequestRepository.findAllEmergencyRequests(any(), any())).thenReturn(repoPage);
            when(keycloakService.getUserProfile(any())).thenReturn(userProfile(SENDER_ID, "user"));
            when(keycloakService.getEmergencyServiceProfile(SERVICE_ID)).thenReturn(serviceProfile());
            when(keycloakService.getEmergencyServiceProfile(serviceId2))
                    .thenReturn(new KeycloakEmergencyServiceProfile(serviceId2, "service2", "s2@example.com", "S2", "Team", null));

            PageResponse<GetEmergencyRequestsResponse> result =
                    service.getEmergencyRequests(null, pageable);

            assertEquals(2, result.items().size());
            verify(keycloakService, times(1)).getEmergencyServiceProfile(SERVICE_ID);
            verify(keycloakService, times(1)).getEmergencyServiceProfile(serviceId2);
        }
    }
}
