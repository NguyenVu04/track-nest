package project.tracknest.emergencyops.controller;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import project.tracknest.emergencyops.domain.safezonelocator.impl.datatype.GetNearestSafeZonesResponse;
import project.tracknest.emergencyops.domain.safezonelocator.service.SafeZoneLocatorService;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyFloat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SafeZoneLocatorControllerTest {

    @Mock
    private SafeZoneLocatorService service;

    @InjectMocks
    private SafeZoneLocatorController controller;

    @Nested
    @DisplayName("GET /safe-zones/nearest")
    class GetNearestSafeZones {

        @Test
        @DisplayName("should_returnOk_withNearestSafeZones")
        void should_returnOk_withNearestSafeZones() {
            double lat = 10.776;
            double lon = 106.702;
            float maxDist = 5000.0f;
            int maxNum = 5;

            GetNearestSafeZonesResponse zone = GetNearestSafeZonesResponse.builder()
                    .safeZoneId(UUID.randomUUID())
                    .safeZoneName("Central Shelter")
                    .latitudeDegrees(10.775)
                    .longitudeDegrees(106.700)
                    .radiusMeters(300.0f)
                    .build();

            when(service.retrieveNearestSafeZones(eq(lat), eq(lon), eq(maxDist), eq(maxNum)))
                    .thenReturn(List.of(zone));

            var response = controller.getNearestSafeZones(lat, lon, maxDist, maxNum);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(1, response.getBody().size());
            assertEquals("Central Shelter", response.getBody().getFirst().getSafeZoneName());
            verify(service).retrieveNearestSafeZones(lat, lon, maxDist, maxNum);
        }

        @Test
        @DisplayName("should_returnOk_withEmptyList_whenNoZonesInRange")
        void should_returnOk_withEmptyList_whenNoZonesInRange() {
            when(service.retrieveNearestSafeZones(anyDouble(), anyDouble(), anyFloat(), anyInt()))
                    .thenReturn(List.of());

            var response = controller.getNearestSafeZones(0.0, 0.0, 100.0f, 10);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isEmpty());
        }

        @Test
        @DisplayName("should_returnOk_withMultipleZones")
        void should_returnOk_withMultipleZones() {
            List<GetNearestSafeZonesResponse> zones = List.of(
                    GetNearestSafeZonesResponse.builder().safeZoneId(UUID.randomUUID())
                            .safeZoneName("Zone 1").latitudeDegrees(10.0).longitudeDegrees(106.0).radiusMeters(100f).build(),
                    GetNearestSafeZonesResponse.builder().safeZoneId(UUID.randomUUID())
                            .safeZoneName("Zone 2").latitudeDegrees(10.1).longitudeDegrees(106.1).radiusMeters(200f).build()
            );

            when(service.retrieveNearestSafeZones(anyDouble(), anyDouble(), anyFloat(), anyInt()))
                    .thenReturn(zones);

            var response = controller.getNearestSafeZones(10.0, 106.0, 10000.0f, 5);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals(2, response.getBody().size());
        }

        @Test
        @DisplayName("should_passCorrectParameters_toService")
        void should_passCorrectParameters_toService() {
            when(service.retrieveNearestSafeZones(anyDouble(), anyDouble(), anyFloat(), anyInt()))
                    .thenReturn(List.of());

            controller.getNearestSafeZones(21.028, 105.834, 2000.0f, 3);

            verify(service).retrieveNearestSafeZones(21.028, 105.834, 2000.0f, 3);
        }
    }
}
