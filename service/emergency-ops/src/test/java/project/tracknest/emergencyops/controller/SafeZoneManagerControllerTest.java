package project.tracknest.emergencyops.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.emergencyops.domain.safezonemanager.impl.datatype.PostSafeZoneRequest;
import project.tracknest.emergencyops.domain.safezonemanager.impl.datatype.PutSafeZoneRequest;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static project.tracknest.emergencyops.utils.SecuritySetup.setUpSecurityContext;

@SpringBootTest
@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
@Transactional
class SafeZoneManagerControllerTest {
    @Autowired
    private SafeZoneManagerController controller;

    @BeforeEach
    void setUp() {
        setUpSecurityContext();
    }

    @Nested
    @DisplayName("Update Safe Zone")
    class DeleteSafeZone {
        @Test
        void deleteSafeZone() {
            UUID safeZoneId = UUID.fromString("a6a66666-6666-6666-6666-666666666666");

            assertDoesNotThrow(() -> {
                var response = controller.deleteSafeZone(safeZoneId);
                assertNotNull(response);
                assertEquals(200, response.getStatusCode().value());
                assertNotNull(response.getBody());
                assertEquals(safeZoneId, response.getBody().getId());
                assertTrue(response.getBody().getDeletedAtMs() > 0);
            });
        }
    }

    @Nested
    @DisplayName("Update Safe Zone")
    class UpdateSafeZone {
        @Test
        void testUpdateSafeZone_success() {
            UUID safeZoneId = UUID.fromString("a6a66666-6666-6666-6666-666666666666");

                assertDoesNotThrow(() -> {
                    var request = new PutSafeZoneRequest(
                            40.7128,
                            -74.0060,
                            150.0f,
                            "Updated Safe Zone Name"
                    );

                    var response = controller.updateSafeZone(safeZoneId, request);
                    assertNotNull(response);
                    assertEquals(200, response.getStatusCode().value());
                    assertNotNull(response.getBody());
                    assertEquals(safeZoneId, response.getBody().getId());
                    assertTrue(response.getBody().getUpdatedAtMs() > 0);
                });
        }
    }

    @Nested
    @DisplayName("Create Safe Zone")
    class PostSafeZone {
        @Test
        void testPostSafeZone_success() {
            PostSafeZoneRequest request = PostSafeZoneRequest.builder()
                    .name("Test Safe Zone")
                    .latitudeDegrees(37.7749)
                    .longitudeDegrees(-122.4194)
                    .radiusMeters(100.0f)
                    .build();

            assertDoesNotThrow(() -> {
                var response = controller.postSafeZone(request);
                assertNotNull(response);
                assertEquals(200, response.getStatusCode().value());
                assertNotNull(response.getBody());
                assertNotNull(response.getBody().getId());
                assertTrue(response.getBody().getCreatedAtMs() > 0);
            });
        }
    }

    @Nested
    @DisplayName("Get Service Safe Zones")
    class GetServiceSafeZones {
        @Test
        void testGetAllServiceSafeZones_success() {
            assertDoesNotThrow(() -> {
                var response = controller.getServiceSafeZones(null, Pageable.ofSize(10));
                assertNotNull(response);
                assertEquals(200, response.getStatusCode().value());
                assertNotNull(response.getBody());
                assertFalse(response.getBody().items().isEmpty());
                var firstItem = response.getBody().items().getFirst();
                assertEquals(UUID.fromString("a6a66666-6666-6666-6666-666666666666"), firstItem.id());
                assertEquals("Admin Command Shelter", firstItem.name());
                assertTrue(firstItem.latitude() >= -90 && firstItem.latitude() <= 90);
                assertTrue(firstItem.longitude() >= -180 && firstItem.longitude() <= 180);
                assertTrue(firstItem.radius() > 0);
            });
        }

        @Test
        void testGetServiceSafeZones_withNameFilter() {
            assertDoesNotThrow(() -> {
                var response = controller.getServiceSafeZones("Admin", Pageable.ofSize(10));
                assertNotNull(response);
                assertEquals(200, response.getStatusCode().value());
                assertNotNull(response.getBody());
                assertFalse(response.getBody().items().isEmpty());
                var firstItem = response.getBody().items().getFirst();
                assertEquals(UUID.fromString("a6a66666-6666-6666-6666-666666666666"), firstItem.id());
                assertEquals("Admin Command Shelter", firstItem.name());
                assertTrue(firstItem.latitude() >= -90 && firstItem.latitude() <= 90);
                assertTrue(firstItem.longitude() >= -180 && firstItem.longitude() <= 180);
                assertTrue(firstItem.radius() > 0);
            });
        }
    }
}