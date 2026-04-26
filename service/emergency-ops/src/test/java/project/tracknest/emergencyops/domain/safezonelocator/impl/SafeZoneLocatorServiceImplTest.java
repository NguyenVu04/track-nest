package project.tracknest.emergencyops.domain.safezonelocator.impl;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.SliceImpl;
import project.tracknest.emergencyops.core.entity.SafeZone;

import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SafeZoneLocatorServiceImplTest {

    @Mock
    private SafeZoneLocatorSafeZoneRepository safeZoneRepository;

    @InjectMocks
    private SafeZoneLocatorServiceImpl service;

    private SafeZone buildZone(String name, double lat, double lon, float radius) {
        return SafeZone.builder()
                .id(UUID.randomUUID())
                .name(name)
                .latitude(lat)
                .longitude(lon)
                .radius(radius)
                .build();
    }

    @Nested
    @DisplayName("retrieveNearestSafeZones")
    class RetrieveNearestSafeZones {

        @Test
        @DisplayName("should_returnNearestZones_whenZonesExistWithinRadius")
        void should_returnNearestZones_whenZonesExistWithinRadius() {
            SafeZone zone = buildZone("Central Shelter", 10.775, 106.700, 300.0f);
            var slice = new SliceImpl<>(List.of(zone));

            when(safeZoneRepository.findNearestSafeZones(eq(10.776), eq(106.702), eq(5000.0f), any(Pageable.class)))
                    .thenReturn(slice);

            var result = service.retrieveNearestSafeZones(10.776, 106.702, 5000.0f, 5);

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("Central Shelter", result.getFirst().getSafeZoneName());
            assertEquals(10.775, result.getFirst().getLatitudeDegrees());
            assertEquals(106.700, result.getFirst().getLongitudeDegrees());
            assertEquals(300.0f, result.getFirst().getRadiusMeters());
            assertNotNull(result.getFirst().getSafeZoneId());
        }

        @Test
        @DisplayName("should_returnEmptyList_whenNoZonesWithinRadius")
        void should_returnEmptyList_whenNoZonesWithinRadius() {
            when(safeZoneRepository.findNearestSafeZones(anyDouble(), anyDouble(), anyFloat(), any(Pageable.class)))
                    .thenReturn(new SliceImpl<>(List.of()));

            var result = service.retrieveNearestSafeZones(0.0, 0.0, 100.0f, 5);

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("should_capPageSizeAtMaxSafeZones_whenRequestedNumberExceedsMax")
        void should_capPageSizeAtMaxSafeZones_whenRequestedNumberExceedsMax() {
            var slice = new SliceImpl<SafeZone>(List.of());
            when(safeZoneRepository.findNearestSafeZones(anyDouble(), anyDouble(), anyFloat(), any(Pageable.class)))
                    .thenReturn(slice);

            service.retrieveNearestSafeZones(10.0, 106.0, 10000.0f, 200);

            verify(safeZoneRepository).findNearestSafeZones(
                    eq(10.0), eq(106.0), eq(10000.0f),
                    argThat(p -> p.getPageSize() == 100)
            );
        }

        @Test
        @DisplayName("should_useRequestedPageSize_whenWithinLimit")
        void should_useRequestedPageSize_whenWithinLimit() {
            var slice = new SliceImpl<SafeZone>(List.of());
            when(safeZoneRepository.findNearestSafeZones(anyDouble(), anyDouble(), anyFloat(), any(Pageable.class)))
                    .thenReturn(slice);

            service.retrieveNearestSafeZones(10.0, 106.0, 5000.0f, 10);

            verify(safeZoneRepository).findNearestSafeZones(
                    eq(10.0), eq(106.0), eq(5000.0f),
                    argThat(p -> p.getPageSize() == 10)
            );
        }

        @Test
        @DisplayName("should_returnMultipleZones_mappedCorrectly")
        void should_returnMultipleZones_mappedCorrectly() {
            List<SafeZone> zones = List.of(
                    buildZone("Zone Alpha", 10.0, 106.0, 100.0f),
                    buildZone("Zone Beta", 10.1, 106.1, 200.0f),
                    buildZone("Zone Gamma", 10.2, 106.2, 300.0f)
            );
            when(safeZoneRepository.findNearestSafeZones(anyDouble(), anyDouble(), anyFloat(), any(Pageable.class)))
                    .thenReturn(new SliceImpl<>(zones));

            var result = service.retrieveNearestSafeZones(10.0, 106.0, 10000.0f, 5);

            assertEquals(3, result.size());
            assertEquals("Zone Alpha", result.get(0).getSafeZoneName());
            assertEquals("Zone Beta", result.get(1).getSafeZoneName());
            assertEquals("Zone Gamma", result.get(2).getSafeZoneName());
        }

        @Test
        @DisplayName("should_passZeroDistanceToRepository_whenMaxDistanceIsZero")
        void should_passZeroDistanceToRepository_whenMaxDistanceIsZero() {
            when(safeZoneRepository.findNearestSafeZones(anyDouble(), anyDouble(), eq(0.0f), any()))
                    .thenReturn(new SliceImpl<>(List.of()));

            var result = service.retrieveNearestSafeZones(10.0, 106.0, 0.0f, 5);

            assertTrue(result.isEmpty());
            verify(safeZoneRepository).findNearestSafeZones(10.0, 106.0, 0.0f, Pageable.ofSize(5));
        }
    }
}
