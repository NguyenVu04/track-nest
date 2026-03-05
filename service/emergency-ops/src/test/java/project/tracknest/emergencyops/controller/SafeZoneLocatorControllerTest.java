package project.tracknest.emergencyops.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static project.tracknest.emergencyops.utils.SecuritySetup.ADMIN_DEFAULT_LATITUDE;
import static project.tracknest.emergencyops.utils.SecuritySetup.ADMIN_DEFAULT_LONGITUDE;

@SpringBootTest
@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
@Transactional
class SafeZoneLocatorControllerTest {
    @Autowired
    private SafeZoneLocatorController controller;

    @Nested
    @DisplayName("Get Nearest Safe Zones")
    class GetNearestSafeZones {
        @Test
        void testGetNearestSafeZones_success() {
            double latitudeDegrees = 10.7761;
            double longitudeDegrees = 106.7024;
            float maxDistanceMeters = 10000; // 10 km
            int maxNumberOfSafeZones = 5;

            assertDoesNotThrow(() -> {
                var response = controller.getNearestSafeZones(
                        latitudeDegrees,
                        longitudeDegrees,
                        maxDistanceMeters,
                        maxNumberOfSafeZones
                );
                assertNotNull(response);
                assertEquals(200, response.getStatusCode().value());
                assertNotNull(response.getBody());
                assertTrue(response.getBody().size() <= maxNumberOfSafeZones && !response.getBody().isEmpty());
            });
        }
    }

}