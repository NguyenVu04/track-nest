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
import project.tracknest.emergencyops.core.entity.EmergencyRequestStatus;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype.PatchEmergencyServiceLocationRequest;
import project.tracknest.emergencyops.utils.SecuritySetup;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static project.tracknest.emergencyops.utils.SecuritySetup.*;

@SpringBootTest
@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
@Transactional
class EmergencyRequestManagerControllerTest {
    @Autowired
    private EmergencyRequestManagerController controller;

    @BeforeEach
    void setUp() {
        setUpSecurityContext();
    }

    @Nested
    @DisplayName("Update Emergency Service Location")
    class UpdateEmergencyServiceLocation {
        @Test
        void testUpdateEmergencyServiceLocation_success() {
            PatchEmergencyServiceLocationRequest request = new PatchEmergencyServiceLocationRequest(
                    37.7749, -122.4194
            );

            assertDoesNotThrow(() -> {
                var response = controller.updateEmergencyServiceLocation(request);
                assertNotNull(response);
                assertEquals(200, response.getStatusCode().value());
                assertNotNull(response.getBody());
                assertEquals(ADMIN_USER_ID, response.getBody().id());
            });
        }
    }

    @Nested
    @DisplayName("Get Emergency Service Location")
    class GetEmergencyServiceLocation {
        @Test
        void testGetEmergencyServiceLocation_success() {
            assertDoesNotThrow(() -> {
                var response = controller.getEmergencyServiceLocation();
                assertNotNull(response);
                assertEquals(200, response.getStatusCode().value());
                assertNotNull(response.getBody());
                assertEquals(ADMIN_DEFAULT_LONGITUDE, response.getBody().longitude());
                assertEquals(ADMIN_DEFAULT_LATITUDE, response.getBody().latitude());
            });
        }

        @Test
        void testGetEmergencyServiceLocation_afterUpdate() {
            PatchEmergencyServiceLocationRequest updateRequest = new PatchEmergencyServiceLocationRequest(
                    37.7749, -122.4194
            );
            controller.updateEmergencyServiceLocation(updateRequest);

            assertDoesNotThrow(() -> {
                var response = controller.getEmergencyServiceLocation();
                assertNotNull(response);
                assertEquals(200, response.getStatusCode().value());
                assertNotNull(response.getBody());
                assertEquals(-122.4194, response.getBody().longitude());
                assertEquals(37.7749, response.getBody().latitude());
            });
        }
    }

    @Nested
    @DisplayName("Get Pending Request Count")
    class GetPendingRequestCount {
        @Test
        void testGetPendingRequestCount_success() {
            assertDoesNotThrow(() -> {
                var response = controller.getPendingRequestCount(EmergencyRequestStatus.Status.PENDING);
                assertNotNull(response);
                assertEquals(200, response.getStatusCode().value());
                assertNotNull(response.getBody());
                assertEquals(3, response.getBody().count());
            });
        }
    }

    @Nested
    @DisplayName("Get Emergency Requests")
    class GetEmergencyRequests {
        @Test
        void testGetAllEmergencyRequests_success() {
            assertDoesNotThrow(() -> {
                var response = controller
                        .getEmergencyRequests(null, Pageable.ofSize(10));
                assertNotNull(response);
                assertEquals(200, response.getStatusCode().value());
                assertNotNull(response.getBody());
                assertEquals(3, response.getBody().items().size());
                var requests = response.getBody().items();
                for (var request : requests) {
                    assertNotNull(request.senderId());
                    assertNotNull(request.targetId());
                    assertNotNull(request.status());
                    assertNotNull(request.id());
                    assertNotNull(request.senderUsername());
                    assertNotNull(request.senderEmail());
                    assertNotNull(request.senderFirstName());
                    assertNotNull(request.senderLastName());
                    assertNotNull(request.senderAvatarUrl());
                    assertNotNull(request.targetUsername());
                    assertNotNull(request.targetEmail());
                    assertNotNull(request.targetFirstName());
                    assertNotNull(request.targetLastName());
                    assertNotNull(request.targetAvatarUrl());
                    assertTrue(request.targetLastLongitude() >= -180 && request.targetLastLongitude() <= 180);
                    assertTrue(request.targetLastLatitude() >= -90 && request.targetLastLatitude() <= 90);
                }
            });
        }
    }

    @Nested
    @DisplayName("Accept Emergency Request")
    class AcceptEmergencyRequest {
        @Test
        void testAcceptEmergencyRequest_success() {
            UUID requestId = UUID.fromString("c6c66666-6666-6666-6666-666666666666");
            assertDoesNotThrow(() -> {
                var response = controller.acceptEmergencyRequest(requestId);
                assertNotNull(response);
                assertEquals(200, response.getStatusCode().value());
                assertNotNull(response.getBody());
                assertEquals(requestId, response.getBody().id());
                assertTrue(response.getBody().acceptedAtMs() > 0);
            });
        }

        @Test
        void testAcceptEmergencyRequest_alreadyAccepted() {
            UUID requestId = UUID.fromString("c6c66666-6666-6666-6666-666666666666");
            controller.acceptEmergencyRequest(requestId); // First accept

            Exception exception = assertThrows(Exception.class, () -> {
                controller.acceptEmergencyRequest(requestId); // Try to accept again
            });

            String expectedMessage = "Only emergency requests in PENDING status can be accepted";
            String actualMessage = exception.getMessage();
            assertTrue(actualMessage.contains(expectedMessage));
            assertInstanceOf(IllegalArgumentException.class, exception);
        }
    }

    @Nested
    @DisplayName("Reject Emergency Request")
    class RejectEmergencyRequest {
        @Test
        void testRejectEmergencyRequest_success() {
            UUID requestId = UUID.fromString("c6c66666-6666-6666-6666-666666666666");
            assertDoesNotThrow(() -> {
                var response = controller.rejectEmergencyRequest(requestId);
                assertNotNull(response);
                assertEquals(200, response.getStatusCode().value());
                assertNotNull(response.getBody());
                assertEquals(requestId, response.getBody().id());
                assertTrue(response.getBody().rejectedAtMs() > 0);
            });
        }

        @Test
        void testRejectEmergencyRequest_alreadyRejected() {
            UUID requestId = UUID.fromString("c6c66666-6666-6666-6666-666666666666");
            controller.rejectEmergencyRequest(requestId); // First reject

            Exception exception = assertThrows(Exception.class, () -> {
                controller.rejectEmergencyRequest(requestId); // Try to reject again
            });

            String expectedMessage = "Only emergency requests in PENDING status can be rejected";
            String actualMessage = exception.getMessage();
            assertTrue(actualMessage.contains(expectedMessage));
            assertInstanceOf(IllegalArgumentException.class, exception);
        }
    }

    @Nested
    @DisplayName("Close Emergency Request")
    class CloseEmergencyRequest {
        @Test
        void testCloseEmergencyRequest_success() {
            UUID requestId = UUID.fromString("c6c66666-6666-6666-6666-666666666666");
            controller.acceptEmergencyRequest(requestId); // First accept

            assertDoesNotThrow(() -> {
                var response = controller.closeEmergencyRequest(requestId);
                assertNotNull(response);
                assertEquals(200, response.getStatusCode().value());
                assertNotNull(response.getBody());
                assertEquals(requestId, response.getBody().id());
                assertTrue(response.getBody().closedAtMs() > 0);
            });
        }

        @Test
        void testCloseEmergencyRequest_notAccepted() {
            UUID requestId = UUID.fromString("c6c66666-6666-6666-6666-666666666666");

            Exception exception = assertThrows(Exception.class, () -> {
                controller.closeEmergencyRequest(requestId); // Try to close without accepting
            });

            String expectedMessage = "Only emergency requests in ACCEPTED status can be closed";
            String actualMessage = exception.getMessage();
            assertTrue(actualMessage.contains(expectedMessage));
            assertInstanceOf(IllegalArgumentException.class, exception);
        }
    }
}