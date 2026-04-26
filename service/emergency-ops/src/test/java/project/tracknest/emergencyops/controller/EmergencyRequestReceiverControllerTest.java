package project.tracknest.emergencyops.controller;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import project.tracknest.emergencyops.core.datatype.PageResponse;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype.CheckEmergencyRequestAllowedResponse;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype.GetTrackerEmergencyRequestsResponse;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype.PostEmergencyRequestRequest;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype.PostEmergencyRequestResponse;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.service.EmergencyRequestReceiverService;
import project.tracknest.emergencyops.utils.SecuritySetup;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmergencyRequestReceiverControllerTest {

    @Mock
    private EmergencyRequestReceiverService service;

    @InjectMocks
    private EmergencyRequestReceiverController controller;

    @BeforeEach
    void setUp() {
        SecuritySetup.setUpSecurityContext(SecuritySetup.NORMAL_USER_ID, SecuritySetup.NORMAL_USERNAME, SecuritySetup.NORMAL_EMAIL);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Nested
    @DisplayName("POST /request")
    class PostEmergencyRequest {

        @Test
        @DisplayName("should_returnCreated_whenRequestIsValid")
        void should_returnCreated_whenRequestIsValid() {
            UUID requestId = UUID.randomUUID();
            PostEmergencyRequestRequest request = PostEmergencyRequestRequest.builder()
                    .targetId(UUID.randomUUID())
                    .lastLatitudeDegrees(10.0)
                    .lastLongitudeDegrees(106.0)
                    .build();
            PostEmergencyRequestResponse expectedResponse = new PostEmergencyRequestResponse(System.currentTimeMillis(), requestId);

            when(service.createEmergencyRequest(eq(SecuritySetup.NORMAL_USER_ID), eq(request))).thenReturn(expectedResponse);

            var response = controller.postEmergencyRequest(request);

            assertEquals(HttpStatus.CREATED, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(requestId, response.getBody().id());
            assertTrue(response.getBody().createdAtMs() > 0);
            verify(service).createEmergencyRequest(SecuritySetup.NORMAL_USER_ID, request);
        }

        @Test
        @DisplayName("should_propagateException_whenActiveRequestExists")
        void should_propagateException_whenActiveRequestExists() {
            PostEmergencyRequestRequest request = PostEmergencyRequestRequest.builder()
                    .targetId(UUID.randomUUID())
                    .lastLatitudeDegrees(10.0)
                    .lastLongitudeDegrees(106.0)
                    .build();

            when(service.createEmergencyRequest(any(), any()))
                    .thenThrow(new RuntimeException("An active emergency request already exists"));

            assertThrows(RuntimeException.class, () -> controller.postEmergencyRequest(request));
        }

        @Test
        @DisplayName("should_propagateException_whenNoNearbyService")
        void should_propagateException_whenNoNearbyService() {
            PostEmergencyRequestRequest request = PostEmergencyRequestRequest.builder()
                    .targetId(UUID.randomUUID())
                    .lastLatitudeDegrees(0.0)
                    .lastLongitudeDegrees(0.0)
                    .build();

            when(service.createEmergencyRequest(any(), any()))
                    .thenThrow(new RuntimeException("No emergency service found near your location"));

            assertThrows(RuntimeException.class, () -> controller.postEmergencyRequest(request));
        }
    }

    @Nested
    @DisplayName("GET /requests")
    class GetTrackerEmergencyRequests {

        @Test
        @DisplayName("should_returnOk_withPageOfRequests")
        void should_returnOk_withPageOfRequests() {
            Pageable pageable = PageRequest.of(0, 10);
            GetTrackerEmergencyRequestsResponse item = new GetTrackerEmergencyRequestsResponse(
                    UUID.randomUUID(), UUID.randomUUID(), "Emergency Service", "+84123456789",
                    System.currentTimeMillis(), null, UUID.randomUUID(),
                    "targetUser", "+84987654321", "target@mail.com",
                    "Target", "User", "http://avatar.url", "PENDING"
            );
            PageResponse<GetTrackerEmergencyRequestsResponse> page =
                    new PageResponse<>(List.of(item), 1, 1, 0, 10);

            when(service.retrieveTrackerEmergencyRequests(eq(SecuritySetup.NORMAL_USER_ID), eq(pageable)))
                    .thenReturn(page);

            var response = controller.getTrackerEmergencyRequests(pageable);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(1, response.getBody().items().size());
            assertEquals(1L, response.getBody().totalItems());
            verify(service).retrieveTrackerEmergencyRequests(SecuritySetup.NORMAL_USER_ID, pageable);
        }

        @Test
        @DisplayName("should_returnEmptyPage_whenNoRequests")
        void should_returnEmptyPage_whenNoRequests() {
            Pageable pageable = PageRequest.of(0, 10);
            PageResponse<GetTrackerEmergencyRequestsResponse> emptyPage =
                    new PageResponse<>(List.of(), 0, 0, 0, 10);

            when(service.retrieveTrackerEmergencyRequests(any(), any())).thenReturn(emptyPage);

            var response = controller.getTrackerEmergencyRequests(pageable);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().items().isEmpty());
        }
    }

    @Nested
    @DisplayName("GET /user/{targetId}/emergency-request-allowed")
    class CheckEmergencyRequestAllowed {

        @Test
        @DisplayName("should_returnOk_whenRequestIsAllowed")
        void should_returnOk_whenRequestIsAllowed() {
            UUID targetId = UUID.randomUUID();
            CheckEmergencyRequestAllowedResponse expectedResponse =
                    new CheckEmergencyRequestAllowedResponse(true, "No active request exists", System.currentTimeMillis());

            when(service.checkEmergencyRequestAllowed(eq(SecuritySetup.NORMAL_USER_ID), eq(targetId)))
                    .thenReturn(expectedResponse);

            var response = controller.checkEmergencyRequestAllowed(targetId);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().allowed());
            verify(service).checkEmergencyRequestAllowed(SecuritySetup.NORMAL_USER_ID, targetId);
        }

        @Test
        @DisplayName("should_returnOk_whenRequestIsNotAllowed")
        void should_returnOk_whenRequestIsNotAllowed() {
            UUID targetId = UUID.randomUUID();
            CheckEmergencyRequestAllowedResponse expectedResponse =
                    new CheckEmergencyRequestAllowedResponse(false, "Active request exists", System.currentTimeMillis());

            when(service.checkEmergencyRequestAllowed(any(), any())).thenReturn(expectedResponse);

            var response = controller.checkEmergencyRequestAllowed(targetId);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertFalse(response.getBody().allowed());
        }
    }
}
