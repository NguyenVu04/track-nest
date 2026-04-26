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
import project.tracknest.emergencyops.domain.safezonemanager.impl.datatype.*;
import project.tracknest.emergencyops.domain.safezonemanager.service.SafeZoneManagerService;
import project.tracknest.emergencyops.utils.SecuritySetup;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SafeZoneManagerControllerTest {

    @Mock
    private SafeZoneManagerService service;

    @InjectMocks
    private SafeZoneManagerController controller;

    @BeforeEach
    void setUp() {
        SecuritySetup.setUpSecurityContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Nested
    @DisplayName("POST /safe-zone")
    class PostSafeZone {

        @Test
        @DisplayName("should_returnCreated_whenSafeZoneCreated")
        void should_returnCreated_whenSafeZoneCreated() {
            PostSafeZoneRequest request = PostSafeZoneRequest.builder()
                    .name("Test Safe Zone")
                    .latitudeDegrees(10.0)
                    .longitudeDegrees(106.0)
                    .radiusMeters(100.0f)
                    .build();
            UUID zoneId = UUID.randomUUID();
            PostSafeZoneResponse expectedResponse = PostSafeZoneResponse.builder()
                    .id(zoneId)
                    .createdAtMs(System.currentTimeMillis())
                    .build();

            when(service.createSafeZone(eq(SecuritySetup.ADMIN_USER_ID), eq(request)))
                    .thenReturn(expectedResponse);

            var response = controller.postSafeZone(request);

            assertEquals(HttpStatus.CREATED, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(zoneId, response.getBody().getId());
            assertTrue(response.getBody().getCreatedAtMs() > 0);
            verify(service).createSafeZone(SecuritySetup.ADMIN_USER_ID, request);
        }

        @Test
        @DisplayName("should_propagateException_whenEmergencyServiceNotFound")
        void should_propagateException_whenEmergencyServiceNotFound() {
            PostSafeZoneRequest request = PostSafeZoneRequest.builder()
                    .name("Zone")
                    .latitudeDegrees(10.0)
                    .longitudeDegrees(106.0)
                    .radiusMeters(50.0f)
                    .build();

            when(service.createSafeZone(any(), any()))
                    .thenThrow(new RuntimeException("Emergency service not found"));

            assertThrows(RuntimeException.class, () -> controller.postSafeZone(request));
        }
    }

    @Nested
    @DisplayName("GET /safe-zones")
    class GetServiceSafeZones {

        @Test
        @DisplayName("should_returnOk_withAllSafeZones_whenNoFilter")
        void should_returnOk_withAllSafeZones_whenNoFilter() {
            Pageable pageable = PageRequest.of(0, 10);
            UUID zoneId = UUID.randomUUID();
            GetServiceSafeZonesResponse item = new GetServiceSafeZonesResponse(
                    zoneId, 10.0, 106.0, 200.0f, "Zone A", OffsetDateTime.now());
            PageResponse<GetServiceSafeZonesResponse> page =
                    new PageResponse<>(List.of(item), 1, 1, 0, 10);

            when(service.retrieveServiceSafeZones(eq(SecuritySetup.ADMIN_USER_ID), eq((String) null), eq(pageable)))
                    .thenReturn(page);

            var response = controller.getServiceSafeZones(null, pageable);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(1, response.getBody().items().size());
            assertEquals("Zone A", response.getBody().items().getFirst().name());
            verify(service).retrieveServiceSafeZones(SecuritySetup.ADMIN_USER_ID, null, pageable);
        }

        @Test
        @DisplayName("should_returnOk_withFilteredSafeZones_whenNameFilterProvided")
        void should_returnOk_withFilteredSafeZones_whenNameFilterProvided() {
            Pageable pageable = PageRequest.of(0, 10);
            PageResponse<GetServiceSafeZonesResponse> page =
                    new PageResponse<>(List.of(), 0, 0, 0, 10);

            when(service.retrieveServiceSafeZones(any(), eq("NonExistent"), any())).thenReturn(page);

            var response = controller.getServiceSafeZones("NonExistent", pageable);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertTrue(response.getBody().items().isEmpty());
        }

        @Test
        @DisplayName("should_returnOk_withEmptyPage_whenNoSafeZones")
        void should_returnOk_withEmptyPage_whenNoSafeZones() {
            Pageable pageable = PageRequest.of(0, 10);
            PageResponse<GetServiceSafeZonesResponse> emptyPage =
                    new PageResponse<>(List.of(), 0, 0, 0, 10);

            when(service.retrieveServiceSafeZones(any(), any(), any())).thenReturn(emptyPage);

            var response = controller.getServiceSafeZones(null, pageable);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertTrue(response.getBody().items().isEmpty());
        }
    }

    @Nested
    @DisplayName("PUT /safe-zone/{safeZoneId}")
    class UpdateSafeZone {

        @Test
        @DisplayName("should_returnOk_whenSafeZoneUpdated")
        void should_returnOk_whenSafeZoneUpdated() {
            UUID zoneId = UUID.randomUUID();
            PutSafeZoneRequest request = new PutSafeZoneRequest(20.0, 100.0, 150.0f, "Updated Zone");
            PutSafeZoneResponse expectedResponse = PutSafeZoneResponse.builder()
                    .id(zoneId)
                    .updatedAtMs(System.currentTimeMillis())
                    .build();

            when(service.updateSafeZone(eq(SecuritySetup.ADMIN_USER_ID), eq(zoneId), eq(request)))
                    .thenReturn(expectedResponse);

            var response = controller.updateSafeZone(zoneId, request);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(zoneId, response.getBody().getId());
            assertTrue(response.getBody().getUpdatedAtMs() > 0);
            verify(service).updateSafeZone(SecuritySetup.ADMIN_USER_ID, zoneId, request);
        }

        @Test
        @DisplayName("should_propagateException_whenSafeZoneNotFound")
        void should_propagateException_whenSafeZoneNotFound() {
            PutSafeZoneRequest request = new PutSafeZoneRequest(10.0, 106.0, 100.0f, "Zone");

            when(service.updateSafeZone(any(), any(), any()))
                    .thenThrow(new RuntimeException("Safe zone not found"));

            assertThrows(RuntimeException.class, () -> controller.updateSafeZone(UUID.randomUUID(), request));
        }
    }

    @Nested
    @DisplayName("DELETE /safe-zone/{safeZoneId}")
    class DeleteSafeZone {

        @Test
        @DisplayName("should_returnOk_whenSafeZoneDeleted")
        void should_returnOk_whenSafeZoneDeleted() {
            UUID zoneId = UUID.randomUUID();
            DeleteSafeZoneResponse expectedResponse = DeleteSafeZoneResponse.builder()
                    .id(zoneId)
                    .deletedAtMs(System.currentTimeMillis())
                    .build();

            when(service.deleteSafeZone(eq(SecuritySetup.ADMIN_USER_ID), eq(zoneId)))
                    .thenReturn(expectedResponse);

            var response = controller.deleteSafeZone(zoneId);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(zoneId, response.getBody().getId());
            assertTrue(response.getBody().getDeletedAtMs() > 0);
            verify(service).deleteSafeZone(SecuritySetup.ADMIN_USER_ID, zoneId);
        }

        @Test
        @DisplayName("should_propagateException_whenSafeZoneNotFound")
        void should_propagateException_whenSafeZoneNotFound() {
            when(service.deleteSafeZone(any(), any()))
                    .thenThrow(new RuntimeException("Safe zone not found"));

            assertThrows(RuntimeException.class, () -> controller.deleteSafeZone(UUID.randomUUID()));
        }
    }
}
