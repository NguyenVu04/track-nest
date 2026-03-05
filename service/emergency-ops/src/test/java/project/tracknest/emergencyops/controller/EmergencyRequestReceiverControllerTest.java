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
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype.PostEmergencyRequestRequest;

import static org.junit.jupiter.api.Assertions.*;
import static project.tracknest.emergencyops.utils.SecuritySetup.*;

@SpringBootTest
@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
@Transactional
class EmergencyRequestReceiverControllerTest {
    @Autowired
    private EmergencyRequestReceiverController controller;

    @BeforeEach
    void setUp() {
        setUpSecurityContext(NORMAL_USER_ID, NORMAL_USERNAME, NORMAL_EMAIL);
    }

    @Nested
    @DisplayName("Post Emergency Request")
    class PostEmergencyRequest {
        @Test
        void testPostEmergencyRequest_success() {
            var request = PostEmergencyRequestRequest
                    .builder()
                    .lastLatitudeDegrees(NORMAL_DEFAULT_LATITUDE)
                    .lastLongitudeDegrees(NORMAL_DEFAULT_LONGITUDE)
                    .targetId(NORMAL_USER_ID)
                    .build();

            assertDoesNotThrow(() -> {
                var response = controller.postEmergencyRequest(request);
                assertNotNull(response);
                assertEquals(200, response.getStatusCode().value());
                assertNotNull(response.getBody());
                assertNotNull(response.getBody().id());
                assertTrue(response.getBody().createdAtMs() > 0);
            });
        }
    }

    @Nested
    @DisplayName("Get Tracker Emergency Requests")
    class GetTrackerEmergencyRequests {
        @Test
        void testGetTrackerEmergencyRequests_success() {
            assertDoesNotThrow(() -> {
                var response = controller.getTrackerEmergencyRequests(Pageable.ofSize(10));
                assertNotNull(response);
                assertEquals(200, response.getStatusCode().value());
                assertNotNull(response.getBody());
                assertEquals(1, response.getBody().items().size());
                var items = response.getBody().items();
                for (var item : items) {
                    assertEquals(ADMIN_USER_ID, item.serviceId());
                    assertNotNull(item.serviceName());
                    assertNotNull(item.servicePhoneNumber());
                    assertNotNull(item.targetId());
                    assertNotNull(item.targetUsername());
                    assertNotNull(item.targetFirstName());
                    assertNotNull(item.targetLastName());
                    assertNotNull(item.targetEmail());
                    assertNotNull(item.targetAvatarUrl());
                    assertNotNull(item.requestId());
                    assertNotNull(item.status());
                    assertTrue(item.createdAtMs() > 0);
                }
            });
        }
    }
}