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
import project.tracknest.emergencyops.core.entity.EmergencyRequestStatus;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.GetEmergencyServiceLocationResponse;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype.*;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.service.EmergencyRequestManagerService;
import project.tracknest.emergencyops.utils.SecuritySetup;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmergencyRequestManagerControllerTest {

    @Mock
    private EmergencyRequestManagerService service;

    @InjectMocks
    private EmergencyRequestManagerController controller;

    @BeforeEach
    void setUp() {
        SecuritySetup.setUpSecurityContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Nested
    @DisplayName("PATCH /emergency-service/location")
    class UpdateEmergencyServiceLocation {

        @Test
        @DisplayName("should_returnOk_whenLocationUpdatedSuccessfully")
        void should_returnOk_whenLocationUpdatedSuccessfully() {
            PatchEmergencyServiceLocationRequest request = PatchEmergencyServiceLocationRequest.builder()
                    .latitudeDegrees(10.0)
                    .longitudeDegrees(106.0)
                    .build();
            PatchEmergencyServiceLocationResponse expectedResponse =
                    new PatchEmergencyServiceLocationResponse(System.currentTimeMillis(), SecuritySetup.ADMIN_USER_ID);

            when(service.updateEmergencyServiceLocation(eq(SecuritySetup.ADMIN_USER_ID), eq(request)))
                    .thenReturn(expectedResponse);

            var response = controller.updateEmergencyServiceLocation(request);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(SecuritySetup.ADMIN_USER_ID, response.getBody().id());
            assertTrue(response.getBody().updatedAtMs() > 0);
            verify(service).updateEmergencyServiceLocation(SecuritySetup.ADMIN_USER_ID, request);
        }

        @Test
        @DisplayName("should_propagateException_whenEmergencyServiceNotFound")
        void should_propagateException_whenEmergencyServiceNotFound() {
            PatchEmergencyServiceLocationRequest request = PatchEmergencyServiceLocationRequest.builder()
                    .latitudeDegrees(10.0).longitudeDegrees(106.0).build();

            when(service.updateEmergencyServiceLocation(any(), any()))
                    .thenThrow(new IllegalArgumentException("Emergency Service not found"));

            assertThrows(IllegalArgumentException.class, () -> controller.updateEmergencyServiceLocation(request));
        }
    }

    @Nested
    @DisplayName("GET /emergency-service/location")
    class GetEmergencyServiceLocation {

        @Test
        @DisplayName("should_returnOk_withCurrentLocation")
        void should_returnOk_withCurrentLocation() {
            long updatedAt = System.currentTimeMillis();
            GetEmergencyServiceLocationResponse expectedResponse =
                    new GetEmergencyServiceLocationResponse(10.0, 106.0, updatedAt);

            when(service.getEmergencyServiceLocation(eq(SecuritySetup.ADMIN_USER_ID)))
                    .thenReturn(expectedResponse);

            var response = controller.getEmergencyServiceLocation();

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(10.0, response.getBody().latitude());
            assertEquals(106.0, response.getBody().longitude());
            assertEquals(updatedAt, response.getBody().updatedAtMs());
        }

        @Test
        @DisplayName("should_returnOk_withNullUpdatedAt_whenNeverUpdated")
        void should_returnOk_withNullUpdatedAt_whenNeverUpdated() {
            GetEmergencyServiceLocationResponse expectedResponse =
                    new GetEmergencyServiceLocationResponse(0.0, 0.0, null);

            when(service.getEmergencyServiceLocation(any())).thenReturn(expectedResponse);

            var response = controller.getEmergencyServiceLocation();

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertNull(response.getBody().updatedAtMs());
        }

        @Test
        @DisplayName("should_propagateException_whenEmergencyServiceNotFound")
        void should_propagateException_whenEmergencyServiceNotFound() {
            when(service.getEmergencyServiceLocation(any()))
                    .thenThrow(new IllegalArgumentException("Emergency Service not found"));

            assertThrows(IllegalArgumentException.class, () -> controller.getEmergencyServiceLocation());
        }
    }

    @Nested
    @DisplayName("GET /requests/count")
    class GetPendingRequestCount {

        @Test
        @DisplayName("should_returnOk_withCount_givenPendingStatus")
        void should_returnOk_withCount_givenPendingStatus() {
            GetRequestCountResponse expectedResponse = new GetRequestCountResponse(5L, System.currentTimeMillis());

            when(service.getEmergencyRequestCount(eq(SecuritySetup.ADMIN_USER_ID), eq(EmergencyRequestStatus.Status.PENDING)))
                    .thenReturn(expectedResponse);

            var response = controller.getPendingRequestCount(EmergencyRequestStatus.Status.PENDING);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(5L, response.getBody().count());
            verify(service).getEmergencyRequestCount(SecuritySetup.ADMIN_USER_ID, EmergencyRequestStatus.Status.PENDING);
        }

        @Test
        @DisplayName("should_returnOk_withTotalCount_whenStatusIsNull")
        void should_returnOk_withTotalCount_whenStatusIsNull() {
            GetRequestCountResponse expectedResponse = new GetRequestCountResponse(10L, System.currentTimeMillis());

            when(service.getEmergencyRequestCount(any(), eq((EmergencyRequestStatus.Status) null)))
                    .thenReturn(expectedResponse);

            var response = controller.getPendingRequestCount(null);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(10L, response.getBody().count());
        }
    }

    @Nested
    @DisplayName("GET /requests")
    class GetEmergencyRequests {

        @Test
        @DisplayName("should_returnOk_withRequests_filteredByStatus")
        void should_returnOk_withRequests_filteredByStatus() {
            Pageable pageable = PageRequest.of(0, 10);
            PageResponse<GetEmergencyRequestsResponse> page =
                    new PageResponse<>(List.of(), 0, 0, 0, 10);

            when(service.getEmergencyRequests(any(), eq(EmergencyRequestStatus.Status.PENDING), eq(pageable)))
                    .thenReturn(page);

            var response = controller.getEmergencyRequests(EmergencyRequestStatus.Status.PENDING, pageable);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            verify(service).getEmergencyRequests(SecuritySetup.ADMIN_USER_ID, EmergencyRequestStatus.Status.PENDING, pageable);
        }

        @Test
        @DisplayName("should_returnOk_withAllRequests_whenStatusIsNull")
        void should_returnOk_withAllRequests_whenStatusIsNull() {
            Pageable pageable = PageRequest.of(0, 5);
            PageResponse<GetEmergencyRequestsResponse> page =
                    new PageResponse<>(List.of(), 0, 0, 0, 5);

            when(service.getEmergencyRequests(any(), eq((EmergencyRequestStatus.Status) null), any()))
                    .thenReturn(page);

            var response = controller.getEmergencyRequests(null, pageable);

            assertEquals(HttpStatus.OK, response.getStatusCode());
        }
    }

    @Nested
    @DisplayName("PATCH /requests/{requestId}/accept")
    class AcceptEmergencyRequest {

        @Test
        @DisplayName("should_returnOk_whenRequestAccepted")
        void should_returnOk_whenRequestAccepted() {
            UUID requestId = UUID.randomUUID();
            AcceptEmergencyRequestResponse expectedResponse =
                    new AcceptEmergencyRequestResponse(System.currentTimeMillis(), requestId);

            when(service.acceptEmergencyRequest(eq(SecuritySetup.ADMIN_USER_ID), eq(requestId)))
                    .thenReturn(expectedResponse);

            var response = controller.acceptEmergencyRequest(requestId);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(requestId, response.getBody().id());
            assertTrue(response.getBody().acceptedAtMs() > 0);
            verify(service).acceptEmergencyRequest(SecuritySetup.ADMIN_USER_ID, requestId);
        }

        @Test
        @DisplayName("should_propagateException_whenRequestNotFound")
        void should_propagateException_whenRequestNotFound() {
            when(service.acceptEmergencyRequest(any(), any()))
                    .thenThrow(new IllegalArgumentException("Emergency request not found"));

            assertThrows(IllegalArgumentException.class, () -> controller.acceptEmergencyRequest(UUID.randomUUID()));
        }

        @Test
        @DisplayName("should_propagateException_whenRequestNotPending")
        void should_propagateException_whenRequestNotPending() {
            when(service.acceptEmergencyRequest(any(), any()))
                    .thenThrow(new IllegalArgumentException("Only emergency requests in PENDING status can be accepted"));

            assertThrows(IllegalArgumentException.class, () -> controller.acceptEmergencyRequest(UUID.randomUUID()));
        }
    }

    @Nested
    @DisplayName("PATCH /requests/{requestId}/reject")
    class RejectEmergencyRequest {

        @Test
        @DisplayName("should_returnOk_whenRequestRejected")
        void should_returnOk_whenRequestRejected() {
            UUID requestId = UUID.randomUUID();
            RejectEmergencyRequestResponse expectedResponse =
                    new RejectEmergencyRequestResponse(System.currentTimeMillis(), requestId);

            when(service.rejectEmergencyRequest(eq(SecuritySetup.ADMIN_USER_ID), eq(requestId)))
                    .thenReturn(expectedResponse);

            var response = controller.rejectEmergencyRequest(requestId);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(requestId, response.getBody().id());
            assertTrue(response.getBody().rejectedAtMs() > 0);
        }

        @Test
        @DisplayName("should_propagateException_whenRequestNotFound")
        void should_propagateException_whenRequestNotFound() {
            when(service.rejectEmergencyRequest(any(), any()))
                    .thenThrow(new IllegalArgumentException("Emergency request not found"));

            assertThrows(IllegalArgumentException.class, () -> controller.rejectEmergencyRequest(UUID.randomUUID()));
        }

        @Test
        @DisplayName("should_propagateException_whenRequestNotPending")
        void should_propagateException_whenRequestNotPending() {
            when(service.rejectEmergencyRequest(any(), any()))
                    .thenThrow(new IllegalArgumentException("Only emergency requests in PENDING status can be rejected"));

            assertThrows(IllegalArgumentException.class, () -> controller.rejectEmergencyRequest(UUID.randomUUID()));
        }
    }

    @Nested
    @DisplayName("PATCH /requests/{requestId}/close")
    class CloseEmergencyRequest {

        @Test
        @DisplayName("should_returnOk_whenRequestClosed")
        void should_returnOk_whenRequestClosed() {
            UUID requestId = UUID.randomUUID();
            CloseEmergencyRequestResponse expectedResponse =
                    new CloseEmergencyRequestResponse(System.currentTimeMillis(), requestId);

            when(service.closeEmergencyRequest(eq(SecuritySetup.ADMIN_USER_ID), eq(requestId)))
                    .thenReturn(expectedResponse);

            var response = controller.closeEmergencyRequest(requestId);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(requestId, response.getBody().id());
            assertTrue(response.getBody().closedAtMs() > 0);
        }

        @Test
        @DisplayName("should_propagateException_whenRequestNotFound")
        void should_propagateException_whenRequestNotFound() {
            when(service.closeEmergencyRequest(any(), any()))
                    .thenThrow(new IllegalArgumentException("Emergency request not found"));

            assertThrows(IllegalArgumentException.class, () -> controller.closeEmergencyRequest(UUID.randomUUID()));
        }

        @Test
        @DisplayName("should_propagateException_whenRequestNotAccepted")
        void should_propagateException_whenRequestNotAccepted() {
            when(service.closeEmergencyRequest(any(), any()))
                    .thenThrow(new IllegalArgumentException("Only emergency requests in ACCEPTED status can be closed"));

            assertThrows(IllegalArgumentException.class, () -> controller.closeEmergencyRequest(UUID.randomUUID()));
        }
    }
}
