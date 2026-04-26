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
import project.tracknest.emergencyops.domain.emergencyresponder.impl.datatype.GetEmergencyServiceTargetsResponse;
import project.tracknest.emergencyops.domain.emergencyresponder.service.EmergencyResponderService;
import project.tracknest.emergencyops.utils.SecuritySetup;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmergencyResponderControllerTest {

    @Mock
    private EmergencyResponderService service;

    @InjectMocks
    private EmergencyResponderController controller;

    @BeforeEach
    void setUp() {
        SecuritySetup.setUpSecurityContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Nested
    @DisplayName("GET /targets")
    class GetEmergencyServiceTargets {

        @Test
        @DisplayName("should_returnOk_withTrackedTargets")
        void should_returnOk_withTrackedTargets() {
            Pageable pageable = PageRequest.of(0, 10);
            UUID targetId = UUID.randomUUID();
            GetEmergencyServiceTargetsResponse target = new GetEmergencyServiceTargetsResponse(
                    targetId, "john_doe", "John", "Doe",
                    "john@mail.com", "+84123456789", "http://avatar.url",
                    10.776, 106.702, System.currentTimeMillis()
            );
            PageResponse<GetEmergencyServiceTargetsResponse> page =
                    new PageResponse<>(List.of(target), 1, 1, 0, 10);

            when(service.retrieveEmergencyServiceTargets(eq(SecuritySetup.ADMIN_USER_ID), eq(pageable)))
                    .thenReturn(page);

            var response = controller.getEmergencyServiceTargets(pageable);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(1, response.getBody().items().size());
            GetEmergencyServiceTargetsResponse item = response.getBody().items().getFirst();
            assertEquals(targetId, item.id());
            assertEquals("john_doe", item.username());
            assertNotNull(item.email());
            assertTrue(item.lastLatitudeDegrees() >= -90 && item.lastLatitudeDegrees() <= 90);
            assertTrue(item.lastLongitudeDegrees() >= -180 && item.lastLongitudeDegrees() <= 180);
            assertTrue(item.lastUpdateTimeMs() > 0);
            verify(service).retrieveEmergencyServiceTargets(SecuritySetup.ADMIN_USER_ID, pageable);
        }

        @Test
        @DisplayName("should_returnOk_withEmptyPage_whenNoTargets")
        void should_returnOk_withEmptyPage_whenNoTargets() {
            Pageable pageable = PageRequest.of(0, 10);
            PageResponse<GetEmergencyServiceTargetsResponse> emptyPage =
                    new PageResponse<>(List.of(), 0, 0, 0, 10);

            when(service.retrieveEmergencyServiceTargets(any(), any())).thenReturn(emptyPage);

            var response = controller.getEmergencyServiceTargets(pageable);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().items().isEmpty());
            assertEquals(0L, response.getBody().totalItems());
        }

        @Test
        @DisplayName("should_returnOk_withMultipleTargets")
        void should_returnOk_withMultipleTargets() {
            Pageable pageable = PageRequest.of(0, 10);
            List<GetEmergencyServiceTargetsResponse> targets = List.of(
                    new GetEmergencyServiceTargetsResponse(UUID.randomUUID(), "user1", "A", "B",
                            "a@mail.com", "+1", "http://a", 10.0, 106.0, System.currentTimeMillis()),
                    new GetEmergencyServiceTargetsResponse(UUID.randomUUID(), "user2", "C", "D",
                            "c@mail.com", "+2", "http://c", 10.1, 106.1, System.currentTimeMillis())
            );
            PageResponse<GetEmergencyServiceTargetsResponse> page =
                    new PageResponse<>(targets, 2, 1, 0, 10);

            when(service.retrieveEmergencyServiceTargets(any(), any())).thenReturn(page);

            var response = controller.getEmergencyServiceTargets(pageable);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals(2, response.getBody().items().size());
            assertEquals(2L, response.getBody().totalItems());
        }
    }
}
