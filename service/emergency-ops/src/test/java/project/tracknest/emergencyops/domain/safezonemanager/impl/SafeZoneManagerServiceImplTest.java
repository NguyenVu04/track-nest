package project.tracknest.emergencyops.domain.safezonemanager.impl;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import project.tracknest.emergencyops.core.entity.EmergencyService;
import project.tracknest.emergencyops.core.entity.SafeZone;
import project.tracknest.emergencyops.domain.safezonemanager.impl.datatype.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SafeZoneManagerServiceImplTest {

    @Mock
    private SafeZoneManagerSafeZoneRepository safeZoneRepository;
    @Mock
    private SafeZoneManagerEmergencyServiceRepository emergencyServiceRepository;

    @InjectMocks
    private SafeZoneManagerServiceImpl service;

    private static final UUID SERVICE_ID = UUID.randomUUID();
    private static final UUID ZONE_ID = UUID.randomUUID();

    private EmergencyService mockService() {
        return EmergencyService.builder()
                .id(SERVICE_ID)
                .username("Service A")
                .phoneNumber("+84123456789")
                .latitude(10.0)
                .longitude(106.0)
                .build();
    }

    private SafeZone mockSafeZone() {
        return SafeZone.builder()
                .id(ZONE_ID)
                .name("Test Zone")
                .latitude(10.0)
                .longitude(106.0)
                .radius(200.0f)
                .emergencyService(mockService())
                .createdAt(OffsetDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("createSafeZone")
    class CreateSafeZone {

        @Test
        @DisplayName("should_createZone_whenServiceFound")
        void should_createZone_whenServiceFound() {
            PostSafeZoneRequest request = PostSafeZoneRequest.builder()
                    .name("New Zone")
                    .latitudeDegrees(10.0)
                    .longitudeDegrees(106.0)
                    .radiusMeters(150.0f)
                    .build();
            SafeZone savedZone = mockSafeZone();

            when(emergencyServiceRepository.findById(SERVICE_ID)).thenReturn(Optional.of(mockService()));
            when(safeZoneRepository.saveAndFlush(any())).thenReturn(savedZone);

            var result = service.createSafeZone(SERVICE_ID, request);

            assertNotNull(result);
            assertEquals(ZONE_ID, result.getId());
            assertTrue(result.getCreatedAtMs() > 0);
            verify(safeZoneRepository).saveAndFlush(any());
        }

        @Test
        @DisplayName("should_throwNotFound_whenServiceDoesNotExist")
        void should_throwNotFound_whenServiceDoesNotExist() {
            PostSafeZoneRequest request = PostSafeZoneRequest.builder()
                    .name("Zone").latitudeDegrees(10.0).longitudeDegrees(106.0).radiusMeters(100.0f).build();

            when(emergencyServiceRepository.findById(any())).thenReturn(Optional.empty());

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> service.createSafeZone(SERVICE_ID, request));
            assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
            verify(safeZoneRepository, never()).saveAndFlush(any());
        }
    }

    @Nested
    @DisplayName("retrieveServiceSafeZones")
    class RetrieveServiceSafeZones {

        @Test
        @DisplayName("should_returnPageOfZones_withNoFilter")
        void should_returnPageOfZones_withNoFilter() {
            Pageable pageable = PageRequest.of(0, 10);
            SafeZone zone = mockSafeZone();
            Page<SafeZone> page = new PageImpl<>(List.of(zone), pageable, 1);

            when(safeZoneRepository.findByEmergencyService_Id(SERVICE_ID, null, pageable)).thenReturn(page);

            var result = service.retrieveServiceSafeZones(SERVICE_ID, null, pageable);

            assertNotNull(result);
            assertEquals(1, result.items().size());
            assertEquals(1L, result.totalItems());
            var item = result.items().getFirst();
            assertEquals(ZONE_ID, item.id());
            assertEquals("Test Zone", item.name());
            assertEquals(10.0, item.latitude());
            assertEquals(106.0, item.longitude());
            assertEquals(200.0f, item.radius());
        }

        @Test
        @DisplayName("should_escapeSpecialCharacters_inNameFilter")
        void should_escapeSpecialCharacters_inNameFilter() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<SafeZone> page = new PageImpl<>(List.of(), pageable, 0);

            when(safeZoneRepository.findByEmergencyService_Id(eq(SERVICE_ID), eq("100\\%Zone"), eq(pageable)))
                    .thenReturn(page);

            var result = service.retrieveServiceSafeZones(SERVICE_ID, "100%Zone", pageable);

            assertTrue(result.items().isEmpty());
            verify(safeZoneRepository).findByEmergencyService_Id(SERVICE_ID, "100\\%Zone", pageable);
        }

        @Test
        @DisplayName("should_escapeUnderscore_inNameFilter")
        void should_escapeUnderscore_inNameFilter() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<SafeZone> page = new PageImpl<>(List.of(), pageable, 0);

            when(safeZoneRepository.findByEmergencyService_Id(eq(SERVICE_ID), eq("zone\\_a"), eq(pageable)))
                    .thenReturn(page);

            var result = service.retrieveServiceSafeZones(SERVICE_ID, "zone_a", pageable);

            assertTrue(result.items().isEmpty());
        }

        @Test
        @DisplayName("should_returnEmptyPage_whenNoZonesExist")
        void should_returnEmptyPage_whenNoZonesExist() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<SafeZone> emptyPage = new PageImpl<>(List.of(), pageable, 0);

            when(safeZoneRepository.findByEmergencyService_Id(any(), any(), any())).thenReturn(emptyPage);

            var result = service.retrieveServiceSafeZones(SERVICE_ID, null, pageable);

            assertTrue(result.items().isEmpty());
            assertEquals(0L, result.totalItems());
        }
    }

    @Nested
    @DisplayName("updateSafeZone")
    class UpdateSafeZone {

        @Test
        @DisplayName("should_updateZone_whenZoneExists")
        void should_updateZone_whenZoneExists() {
            PutSafeZoneRequest request = new PutSafeZoneRequest(20.0, 100.0, 300.0f, "Updated Zone");
            SafeZone zone = mockSafeZone();

            when(safeZoneRepository.findByIdAndEmergencyService_Id(ZONE_ID, SERVICE_ID))
                    .thenReturn(Optional.of(zone));
            when(safeZoneRepository.save(zone)).thenReturn(zone);

            var result = service.updateSafeZone(SERVICE_ID, ZONE_ID, request);

            assertNotNull(result);
            assertEquals(ZONE_ID, result.getId());
            assertTrue(result.getUpdatedAtMs() > 0);
            assertEquals("Updated Zone", zone.getName());
            assertEquals(20.0, zone.getLatitude());
            assertEquals(100.0, zone.getLongitude());
            assertEquals(300.0f, zone.getRadius());
            verify(safeZoneRepository).save(zone);
        }

        @Test
        @DisplayName("should_throwNotFound_whenZoneDoesNotExist")
        void should_throwNotFound_whenZoneDoesNotExist() {
            PutSafeZoneRequest request = new PutSafeZoneRequest(10.0, 106.0, 100.0f, "Zone");

            when(safeZoneRepository.findByIdAndEmergencyService_Id(any(), any())).thenReturn(Optional.empty());

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> service.updateSafeZone(SERVICE_ID, ZONE_ID, request));
            assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
            verify(safeZoneRepository, never()).save(any());
        }

        @Test
        @DisplayName("should_throwNotFound_whenZoneBelongsToOtherService")
        void should_throwNotFound_whenZoneBelongsToOtherService() {
            PutSafeZoneRequest request = new PutSafeZoneRequest(10.0, 106.0, 100.0f, "Zone");
            UUID otherServiceId = UUID.randomUUID();

            when(safeZoneRepository.findByIdAndEmergencyService_Id(ZONE_ID, otherServiceId))
                    .thenReturn(Optional.empty());

            assertThrows(ResponseStatusException.class,
                    () -> service.updateSafeZone(otherServiceId, ZONE_ID, request));
        }
    }

    @Nested
    @DisplayName("deleteSafeZone")
    class DeleteSafeZone {

        @Test
        @DisplayName("should_deleteZone_whenZoneExists")
        void should_deleteZone_whenZoneExists() {
            SafeZone zone = mockSafeZone();

            when(safeZoneRepository.findByIdAndEmergencyService_Id(ZONE_ID, SERVICE_ID))
                    .thenReturn(Optional.of(zone));
            doNothing().when(safeZoneRepository).delete(zone);

            var result = service.deleteSafeZone(SERVICE_ID, ZONE_ID);

            assertNotNull(result);
            assertEquals(ZONE_ID, result.getId());
            assertTrue(result.getDeletedAtMs() > 0);
            verify(safeZoneRepository).delete(zone);
        }

        @Test
        @DisplayName("should_throwNotFound_whenZoneDoesNotExist")
        void should_throwNotFound_whenZoneDoesNotExist() {
            when(safeZoneRepository.findByIdAndEmergencyService_Id(any(), any())).thenReturn(Optional.empty());

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> service.deleteSafeZone(SERVICE_ID, ZONE_ID));
            assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
            verify(safeZoneRepository, never()).delete(any());
        }

        @Test
        @DisplayName("should_throwNotFound_whenZoneBelongsToOtherService")
        void should_throwNotFound_whenZoneBelongsToOtherService() {
            UUID otherServiceId = UUID.randomUUID();
            when(safeZoneRepository.findByIdAndEmergencyService_Id(ZONE_ID, otherServiceId))
                    .thenReturn(Optional.empty());

            assertThrows(ResponseStatusException.class,
                    () -> service.deleteSafeZone(otherServiceId, ZONE_ID));
            verify(safeZoneRepository, never()).delete(any());
        }
    }
}
