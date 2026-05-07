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
import project.tracknest.emergencyops.domain.emergencyrequestadmin.impl.datatype.GetEmergencyRequestsResponse;
import project.tracknest.emergencyops.domain.emergencyrequestadmin.service.EmergencyRequestAdminService;
import project.tracknest.emergencyops.utils.SecuritySetup;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmergencyRequestAdminControllerTest {

    @Mock
    private EmergencyRequestAdminService service;

    @InjectMocks
    private EmergencyRequestAdminController controller;

    @BeforeEach
    void setUp() {
        SecuritySetup.setUpSecurityContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Nested
    @DisplayName("GET /emergency-request-admin/requests")
    class GetEmergencyRequests {

        @Test
        @DisplayName("should_returnOk_withPagedResults_whenStatusIsProvided")
        void should_returnOk_withPagedResults_whenStatusIsProvided() {
            Pageable pageable = PageRequest.of(0, 10);
            GetEmergencyRequestsResponse item = buildResponse();
            PageResponse<GetEmergencyRequestsResponse> page = new PageResponse<>(List.of(item), 1, 1, 0, 10);

            when(service.getEmergencyRequests(eq(EmergencyRequestStatus.Status.PENDING), eq(pageable)))
                    .thenReturn(page);

            var response = controller.getEmergencyRequests(EmergencyRequestStatus.Status.PENDING, pageable);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(1, response.getBody().items().size());
            assertEquals(1L, response.getBody().totalItems());
            verify(service).getEmergencyRequests(EmergencyRequestStatus.Status.PENDING, pageable);
        }

        @Test
        @DisplayName("should_returnOk_withAllRequests_whenStatusIsNull")
        void should_returnOk_withAllRequests_whenStatusIsNull() {
            Pageable pageable = PageRequest.of(0, 5);
            PageResponse<GetEmergencyRequestsResponse> page = new PageResponse<>(List.of(), 0, 0, 0, 5);

            when(service.getEmergencyRequests(eq((EmergencyRequestStatus.Status) null), eq(pageable)))
                    .thenReturn(page);

            var response = controller.getEmergencyRequests(null, pageable);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(0, response.getBody().items().size());
            verify(service).getEmergencyRequests(null, pageable);
        }

        @Test
        @DisplayName("should_returnOk_withMultipleStatusVariants")
        void should_returnOk_withMultipleStatusVariants() {
            Pageable pageable = PageRequest.of(0, 10);

            for (EmergencyRequestStatus.Status status : EmergencyRequestStatus.Status.values()) {
                PageResponse<GetEmergencyRequestsResponse> page = new PageResponse<>(List.of(), 0, 0, 0, 10);
                when(service.getEmergencyRequests(eq(status), eq(pageable))).thenReturn(page);

                var response = controller.getEmergencyRequests(status, pageable);

                assertEquals(HttpStatus.OK, response.getStatusCode());
            }
        }

        @Test
        @DisplayName("should_propagateException_whenServiceThrows")
        void should_propagateException_whenServiceThrows() {
            Pageable pageable = PageRequest.of(0, 10);
            when(service.getEmergencyRequests(any(), any()))
                    .thenThrow(new RuntimeException("Keycloak unavailable"));

            assertThrows(RuntimeException.class, () -> controller.getEmergencyRequests(null, pageable));
        }
    }

    private GetEmergencyRequestsResponse buildResponse() {
        return GetEmergencyRequestsResponse.builder()
                .id(UUID.randomUUID())
                .senderId(UUID.randomUUID())
                .senderUsername("sender")
                .senderEmail("sender@example.com")
                .targetId(UUID.randomUUID())
                .targetUsername("target")
                .targetEmail("target@example.com")
                .openedAt(System.currentTimeMillis())
                .status("PENDING")
                .targetLastLatitude(10.0)
                .targetLastLongitude(106.0)
                .serviceId(UUID.randomUUID())
                .serviceUsername("service")
                .serviceEmail("service@example.com")
                .build();
    }
}
