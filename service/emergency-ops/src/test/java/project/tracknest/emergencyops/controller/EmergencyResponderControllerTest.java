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

import static org.junit.jupiter.api.Assertions.*;
import static project.tracknest.emergencyops.utils.SecuritySetup.setUpSecurityContext;

@SpringBootTest
@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
@Transactional
class EmergencyResponderControllerTest {
    @Autowired
    private EmergencyResponderController controller;

    @BeforeEach
    void setUp() {
        setUpSecurityContext();
    }
    //TODO: Add test for STOMP endpoints
    @Nested
    @DisplayName("Get Emergency Service Targets")
    class GetEmergencyServiceTargets {
        @Test
        void testGetEmergencyServiceTargets_success() {
            assertDoesNotThrow(() -> {
                var response = controller.getEmergencyServiceTargets(Pageable.ofSize(10));
                assertNotNull(response);
                assertEquals(200, response.getStatusCode().value());
                assertNotNull(response.getBody());
                assertEquals(2, response.getBody().items().size());
                var items = response.getBody().items();
                for (var item : items) {
                    assertNotNull(item.id());
                    assertNotNull(item.username());
                    assertNotNull(item.firstName());
                    assertNotNull(item.lastName());
                    assertNotNull(item.email());
                    assertNotNull(item.phoneNumber());
                    assertNotNull(item.avatarUrl());
                    assertTrue(item.lastLatitudeDegrees() >= -90 && item.lastLatitudeDegrees() <= 90);
                    assertTrue(item.lastLongitudeDegrees() >= -180 && item.lastLongitudeDegrees() <= 180);
                    assertTrue(item.lastUpdateTimeMs() > 0);
                }
            });
        }
    }
}