package project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import project.tracknest.emergencyops.configuration.cache.ServerRedisMessagePublisher;
import project.tracknest.emergencyops.configuration.security.KeycloakService;
import project.tracknest.emergencyops.configuration.security.datatype.KeycloakUserProfile;
import project.tracknest.emergencyops.core.datatype.TrackingNotificationMessage;
import project.tracknest.emergencyops.core.entity.EmergencyRequest;
import project.tracknest.emergencyops.core.entity.EmergencyRequestStatus;
import project.tracknest.emergencyops.core.entity.EmergencyService;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmergencyRequestReceiverServiceImplTest {

    @Mock
    private EmergencyRequestReceiverEmergencyRequestRepository emergencyRequestRepository;
    @Mock
    private EmergencyRequestReceiverEmergencyRequestStatusRepository emergencyRequestStatusRepository;
    @Mock
    private EmergencyRequestReceiverEmergencyServiceRepository emergencyServiceRepository;
    @Mock
    private KeycloakService keycloakService;
    @Mock
    private ServerRedisMessagePublisher redisPublisher;
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    @Mock
    private KafkaTemplate<String, TrackingNotificationMessage> kafkaTemplate;

    @InjectMocks
    private EmergencyRequestReceiverServiceImpl service;

    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID TARGET_ID = UUID.randomUUID();
    private static final UUID SERVICE_ID = UUID.randomUUID();
    private static final UUID REQUEST_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "emergencyRequestQueue", "/queue/emergency-request");
        ReflectionTestUtils.setField(service, "TOPIC", "tracking-notification");
    }

    private EmergencyRequestStatus pendingStatus() {
        return new EmergencyRequestStatus(EmergencyRequestStatus.Status.PENDING.getValue());
    }

    private EmergencyService mockEmergencyService() {
        return EmergencyService.builder()
                .id(SERVICE_ID)
                .username("EmergencyServiceA")
                .phoneNumber("+84123456789")
                .latitude(10.0)
                .longitude(106.0)
                .build();
    }

    private EmergencyRequest mockRequest(EmergencyRequestStatus status) {
        return EmergencyRequest.builder()
                .id(REQUEST_ID)
                .senderId(USER_ID)
                .targetId(TARGET_ID)
                .latitude(10.0)
                .longitude(106.0)
                .status(status)
                .emergencyService(mockEmergencyService())
                .build();
    }

    private KeycloakUserProfile mockProfile(UUID id) {
        return new KeycloakUserProfile(id, "username", "user@mail.com", "First", "Last", "http://avatar", "+1234567890");
    }

    @Nested
    @DisplayName("createEmergencyRequest")
    class CreateEmergencyRequest {

        @Test
        @DisplayName("should_createRequest_whenNoActiveRequestExists")
        void should_createRequest_whenNoActiveRequestExists() {
            PostEmergencyRequestRequest request = PostEmergencyRequestRequest.builder()
                    .targetId(TARGET_ID)
                    .lastLatitudeDegrees(10.0)
                    .lastLongitudeDegrees(106.0)
                    .build();

            when(emergencyRequestRepository.findByTargetId(TARGET_ID)).thenReturn(Optional.empty());
            when(emergencyRequestStatusRepository.findById(EmergencyRequestStatus.Status.PENDING.getValue()))
                    .thenReturn(Optional.of(pendingStatus()));
            when(emergencyServiceRepository.findNearestEmergencyService(10.0, 106.0))
                    .thenReturn(Optional.of(mockEmergencyService()));

            EmergencyRequest savedRequest = mockRequest(pendingStatus());
            savedRequest.setOpenAt(OffsetDateTime.now());
            when(emergencyRequestRepository.save(any())).thenReturn(savedRequest);
            when(keycloakService.getUserProfile(TARGET_ID)).thenReturn(mockProfile(TARGET_ID));
            doNothing().when(redisPublisher).publishMessage(any(), any());
            when(kafkaTemplate.send(any(String.class), any(TrackingNotificationMessage.class))).thenReturn(null);

            PostEmergencyRequestResponse response = service.createEmergencyRequest(USER_ID, request);

            assertNotNull(response);
            assertEquals(REQUEST_ID, response.id());
            assertTrue(response.createdAtMs() > 0);
            verify(emergencyRequestRepository).save(any());
            verify(redisPublisher).publishMessage(any(), eq(SERVICE_ID));
            verify(kafkaTemplate).send(eq("tracking-notification"), any(TrackingNotificationMessage.class));
        }

        @Test
        @DisplayName("should_throwConflict_whenActiveRequestAlreadyExists")
        void should_throwConflict_whenActiveRequestAlreadyExists() {
            PostEmergencyRequestRequest request = PostEmergencyRequestRequest.builder()
                    .targetId(TARGET_ID).lastLatitudeDegrees(10.0).lastLongitudeDegrees(106.0).build();

            EmergencyRequest activeRequest = mockRequest(pendingStatus());
            when(emergencyRequestRepository.findByTargetId(TARGET_ID))
                    .thenReturn(Optional.of(activeRequest));

            assertThrows(ResponseStatusException.class, () -> service.createEmergencyRequest(USER_ID, request));
            verify(emergencyRequestRepository, never()).save(any());
        }

        @Test
        @DisplayName("should_throwConflict_whenExistingRequestIsAccepted")
        void should_throwConflict_whenExistingRequestIsAccepted() {
            PostEmergencyRequestRequest request = PostEmergencyRequestRequest.builder()
                    .targetId(TARGET_ID).lastLatitudeDegrees(10.0).lastLongitudeDegrees(106.0).build();

            EmergencyRequest acceptedRequest = mockRequest(
                    new EmergencyRequestStatus(EmergencyRequestStatus.Status.ACCEPTED.getValue()));
            when(emergencyRequestRepository.findByTargetId(TARGET_ID))
                    .thenReturn(Optional.of(acceptedRequest));

            assertThrows(ResponseStatusException.class, () -> service.createEmergencyRequest(USER_ID, request));
        }

        @Test
        @DisplayName("should_throwNotFound_whenNoNearbyEmergencyService")
        void should_throwNotFound_whenNoNearbyEmergencyService() {
            PostEmergencyRequestRequest request = PostEmergencyRequestRequest.builder()
                    .targetId(TARGET_ID).lastLatitudeDegrees(10.0).lastLongitudeDegrees(106.0).build();

            when(emergencyRequestRepository.findByTargetId(TARGET_ID)).thenReturn(Optional.empty());
            when(emergencyRequestStatusRepository.findById(any())).thenReturn(Optional.of(pendingStatus()));
            when(emergencyServiceRepository.findNearestEmergencyService(anyDouble(), anyDouble()))
                    .thenReturn(Optional.empty());

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> service.createEmergencyRequest(USER_ID, request));
            assertEquals(404, ex.getStatusCode().value());
        }

        @Test
        @DisplayName("should_throwIllegalState_whenPendingStatusNotInDatabase")
        void should_throwIllegalState_whenPendingStatusNotInDatabase() {
            PostEmergencyRequestRequest request = PostEmergencyRequestRequest.builder()
                    .targetId(TARGET_ID).lastLatitudeDegrees(10.0).lastLongitudeDegrees(106.0).build();

            when(emergencyRequestRepository.findByTargetId(TARGET_ID)).thenReturn(Optional.empty());
            when(emergencyRequestStatusRepository.findById(any())).thenReturn(Optional.empty());

            assertThrows(IllegalStateException.class, () -> service.createEmergencyRequest(USER_ID, request));
        }

        @Test
        @DisplayName("should_throwConflict_whenConcurrentRequestCreationDetected")
        void should_throwConflict_whenConcurrentRequestCreationDetected() {
            PostEmergencyRequestRequest request = PostEmergencyRequestRequest.builder()
                    .targetId(TARGET_ID).lastLatitudeDegrees(10.0).lastLongitudeDegrees(106.0).build();

            when(emergencyRequestRepository.findByTargetId(TARGET_ID)).thenReturn(Optional.empty());
            when(emergencyRequestStatusRepository.findById(any())).thenReturn(Optional.of(pendingStatus()));
            when(emergencyServiceRepository.findNearestEmergencyService(anyDouble(), anyDouble()))
                    .thenReturn(Optional.of(mockEmergencyService()));
            when(emergencyRequestRepository.save(any()))
                    .thenThrow(new DataIntegrityViolationException("duplicate key"));

            assertThrows(ResponseStatusException.class, () -> service.createEmergencyRequest(USER_ID, request));
        }
    }

    @Nested
    @DisplayName("retrieveTrackerEmergencyRequests")
    class RetrieveTrackerEmergencyRequests {

        @Test
        @DisplayName("should_returnPageOfRequests_whenRequestsExist")
        void should_returnPageOfRequests_whenRequestsExist() {
            Pageable pageable = PageRequest.of(0, 10);
            EmergencyRequest req = mockRequest(pendingStatus());
            req.setOpenAt(OffsetDateTime.now());
            Page<EmergencyRequest> page = new PageImpl<>(List.of(req), pageable, 1);

            when(emergencyRequestRepository.findBySenderId(USER_ID, pageable)).thenReturn(page);
            when(keycloakService.getUserProfile(TARGET_ID)).thenReturn(mockProfile(TARGET_ID));

            var result = service.retrieveTrackerEmergencyRequests(USER_ID, pageable);

            assertNotNull(result);
            assertEquals(1, result.items().size());
            assertEquals(1L, result.totalItems());
            var item = result.items().getFirst();
            assertEquals(REQUEST_ID, item.requestId());
            assertEquals(SERVICE_ID, item.serviceId());
            assertEquals(TARGET_ID, item.targetId());
            assertEquals("PENDING", item.status());
        }

        @Test
        @DisplayName("should_returnEmptyPage_whenNoRequests")
        void should_returnEmptyPage_whenNoRequests() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<EmergencyRequest> emptyPage = new PageImpl<>(List.of(), pageable, 0);

            when(emergencyRequestRepository.findBySenderId(USER_ID, pageable)).thenReturn(emptyPage);

            var result = service.retrieveTrackerEmergencyRequests(USER_ID, pageable);

            assertNotNull(result);
            assertTrue(result.items().isEmpty());
            assertEquals(0L, result.totalItems());
        }
    }

    @Nested
    @DisplayName("checkEmergencyRequestAllowed")
    class CheckEmergencyRequestAllowed {

        @Test
        @DisplayName("should_returnAllowedTrue_whenNoRequestExists")
        void should_returnAllowedTrue_whenNoRequestExists() {
            when(emergencyRequestRepository.findByTargetId(TARGET_ID)).thenReturn(Optional.empty());

            var result = service.checkEmergencyRequestAllowed(USER_ID, TARGET_ID);

            assertTrue(result.allowed());
            assertTrue(result.checkedAtMs() > 0);
        }

        @Test
        @DisplayName("should_returnAllowedFalse_whenPendingRequestExists")
        void should_returnAllowedFalse_whenPendingRequestExists() {
            EmergencyRequest pendingRequest = mockRequest(pendingStatus());
            when(emergencyRequestRepository.findByTargetId(TARGET_ID))
                    .thenReturn(Optional.of(pendingRequest));

            var result = service.checkEmergencyRequestAllowed(USER_ID, TARGET_ID);

            assertFalse(result.allowed());
        }

        @Test
        @DisplayName("should_returnAllowedFalse_whenAcceptedRequestExists")
        void should_returnAllowedFalse_whenAcceptedRequestExists() {
            EmergencyRequest acceptedRequest = mockRequest(
                    new EmergencyRequestStatus(EmergencyRequestStatus.Status.ACCEPTED.getValue()));
            when(emergencyRequestRepository.findByTargetId(TARGET_ID))
                    .thenReturn(Optional.of(acceptedRequest));

            var result = service.checkEmergencyRequestAllowed(USER_ID, TARGET_ID);

            assertFalse(result.allowed());
        }

        @Test
        @DisplayName("should_returnAllowedTrue_whenClosedRequestExists")
        void should_returnAllowedTrue_whenClosedRequestExists() {
            EmergencyRequest closedRequest = mockRequest(
                    new EmergencyRequestStatus(EmergencyRequestStatus.Status.CLOSED.getValue()));
            when(emergencyRequestRepository.findByTargetId(TARGET_ID))
                    .thenReturn(Optional.of(closedRequest));

            var result = service.checkEmergencyRequestAllowed(USER_ID, TARGET_ID);

            assertTrue(result.allowed());
        }

        @Test
        @DisplayName("should_returnAllowedTrue_whenRejectedRequestExists")
        void should_returnAllowedTrue_whenRejectedRequestExists() {
            EmergencyRequest rejectedRequest = mockRequest(
                    new EmergencyRequestStatus(EmergencyRequestStatus.Status.REJECTED.getValue()));
            when(emergencyRequestRepository.findByTargetId(TARGET_ID))
                    .thenReturn(Optional.of(rejectedRequest));

            var result = service.checkEmergencyRequestAllowed(USER_ID, TARGET_ID);

            assertTrue(result.allowed());
        }
    }

    @Nested
    @DisplayName("receiveEmergencyRequestMessage")
    class ReceiveEmergencyRequestMessage {

        @Test
        @DisplayName("should_sendMessageViaWebSocket_whenCalled")
        void should_sendMessageViaWebSocket_whenCalled() {
            AssignedEmergencyRequestMessage message = new AssignedEmergencyRequestMessage(REQUEST_ID, System.currentTimeMillis());

            service.receiveEmergencyRequestMessage(SERVICE_ID, message);

            verify(messagingTemplate).convertAndSendToUser(
                    eq(SERVICE_ID.toString()),
                    eq("/queue/emergency-request"),
                    eq(message)
            );
        }
    }
}
