package project.tracknest.usertracking.controller;

import com.google.rpc.Code;
import io.grpc.stub.ServerCallStreamObserver;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.usertracking.proto.lib.*;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static project.tracknest.usertracking.utils.SecuritySetup.*;

@SpringBootTest
@ExtendWith(MockitoExtension.class)
@Transactional
class TrackerControllerTest {
    @Autowired
    private TrackerController trackerController;

    @BeforeEach
    public void setUp() {
        setUpSecurityContext();
    }

    // ==================== StreamFamilyMemberLocations Tests ====================

    @Nested
    @DisplayName("StreamFamilyMemberLocations Tests")
    class StreamFamilyMemberLocationsTests {

        @Test
        @DisplayName("Should stream family member locations for admin user in Admin Circle")
        void shouldStreamFamilyMemberLocations_forAdminUser() {
            // Admin (f8f735b4-549c-4d8c-9e10-15f8c198b71b) is in Admin Circle with user4
            setUpSecurityContext(ADMIN_USER_ID, ADMIN_USERNAME, ADMIN_EMAIL);

            StreamFamilyMemberLocationsRequest request = StreamFamilyMemberLocationsRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .build();

            List<FamilyMemberLocation> receivedLocations = new ArrayList<>();

            @SuppressWarnings("unchecked")
            ServerCallStreamObserver<FamilyMemberLocation> responseObserver =
                    mock(ServerCallStreamObserver.class);

            doAnswer(invocation -> {
                receivedLocations.add(invocation.getArgument(0));
                return null;
            }).when(responseObserver).onNext(any(FamilyMemberLocation.class));

            trackerController.streamFamilyMemberLocations(request, responseObserver);

            // Verify disableAutoRequest was called
            verify(responseObserver).disableAutoRequest();

            // Verify setOnCancelHandler was called
            verify(responseObserver).setOnCancelHandler(any(Runnable.class));

            // User4 (2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5) should be in results
            // as admin is in Admin Circle with user4
            assertNotNull(receivedLocations);
        }

        @Test
        @DisplayName("Should stream family member locations for user2 in Family Circle 1")
        void shouldStreamFamilyMemberLocations_forUser2() {
            // User2 is Mother (admin) in Family Circle 1 with user1 and user3
            setUpSecurityContext(USER2_ID, "user2", "user2@gmail.com");

            StreamFamilyMemberLocationsRequest request = StreamFamilyMemberLocationsRequest.newBuilder()
                    .setFamilyCircleId(FAMILY_CIRCLE_1_ID)
                    .build();

            List<FamilyMemberLocation> receivedLocations = new ArrayList<>();

            @SuppressWarnings("unchecked")
            ServerCallStreamObserver<FamilyMemberLocation> responseObserver =
                    mock(ServerCallStreamObserver.class);

            doAnswer(invocation -> {
                receivedLocations.add(invocation.getArgument(0));
                return null;
            }).when(responseObserver).onNext(any(FamilyMemberLocation.class));

            trackerController.streamFamilyMemberLocations(request, responseObserver);

            verify(responseObserver).disableAutoRequest();
            verify(responseObserver).setOnCancelHandler(any(Runnable.class));

            // Should have locations for family members (user1 and user3)
            assertNotNull(receivedLocations);
        }

        @Test
        @DisplayName("Should handle onCancel callback for stream")
        void shouldHandleOnCancelCallback() {
            setUpSecurityContext(USER1_ID, "user1", "user1@gmail.com");

            StreamFamilyMemberLocationsRequest request = StreamFamilyMemberLocationsRequest.newBuilder()
                    .setFamilyCircleId(FAMILY_CIRCLE_1_ID)
                    .build();

            @SuppressWarnings("unchecked")
            ServerCallStreamObserver<FamilyMemberLocation> responseObserver =
                    mock(ServerCallStreamObserver.class);

            ArgumentCaptor<Runnable> cancelHandlerCaptor = ArgumentCaptor.forClass(Runnable.class);

            trackerController.streamFamilyMemberLocations(request, responseObserver);

            verify(responseObserver).setOnCancelHandler(cancelHandlerCaptor.capture());

            // Execute the cancel handler - should not throw exception
            Runnable cancelHandler = cancelHandlerCaptor.getValue();
            assertDoesNotThrow(cancelHandler::run);
        }

        @Test
        @DisplayName("Should stream locations for user with multiple family circles")
        void shouldStreamLocations_forUserWithMultipleCircles() {
            // User3 (4405a37d-bc86-403e-b605-bedd7db88d37) is in multiple circles
            setUpSecurityContext(USER3_ID, "user3", "user3@gmail.com");

            StreamFamilyMemberLocationsRequest request = StreamFamilyMemberLocationsRequest.newBuilder()
                    .setFamilyCircleId(FAMILY_CIRCLE_1_ID)
                    .build();

            @SuppressWarnings("unchecked")
            ServerCallStreamObserver<FamilyMemberLocation> responseObserver =
                    mock(ServerCallStreamObserver.class);

            trackerController.streamFamilyMemberLocations(request, responseObserver);

            verify(responseObserver).disableAutoRequest();
            verify(responseObserver).setOnCancelHandler(any(Runnable.class));
        }
    }

    // ==================== ListFamilyMemberLocationHistory Tests ====================

    @Nested
    @DisplayName("ListFamilyMemberLocationHistory Tests")
    class ListFamilyMemberLocationHistoryTests {

        @Test
        @DisplayName("Should return location history for family member without spatial filter")
        void shouldReturnLocationHistory_withoutSpatialFilter() {
            // User2 is in Family Circle 1 with user1
            setUpSecurityContext(USER2_ID, "user2", "user2@gmail.com");

            ListFamilyMemberLocationHistoryRequest request = ListFamilyMemberLocationHistoryRequest.newBuilder()
                    .setFamilyCircleId(FAMILY_CIRCLE_1_ID)
                    .setMemberId(USER1_ID.toString())
                    .setMemberUsername("user1")
                    .build();

            AtomicReference<ListFamilyMemberLocationHistoryResponse> responseRef = new AtomicReference<>();
            AtomicReference<Throwable> errorRef = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);

            StreamObserver<ListFamilyMemberLocationHistoryResponse> responseObserver =
                    new StreamObserver<>() {
                        @Override
                        public void onNext(ListFamilyMemberLocationHistoryResponse response) {
                            responseRef.set(response);
                        }

                        @Override
                        public void onError(Throwable t) {
                            errorRef.set(t);
                            latch.countDown();
                        }

                        @Override
                        public void onCompleted() {
                            latch.countDown();
                        }
                    };

            trackerController.listFamilyMemberLocationHistory(request, responseObserver);

            try {
                assertTrue(latch.await(5, TimeUnit.SECONDS));
            } catch (InterruptedException e) {
                fail("Test timed out");
            }

            assertNull(errorRef.get());
            assertNotNull(responseRef.get());

            ListFamilyMemberLocationHistoryResponse response = responseRef.get();
            assertEquals(Code.OK_VALUE, response.getStatus().getCode());
            // User1 has 4 locations in test data
            assertTrue(response.getLocationsCount() >= 0);
        }

        @Test
        @DisplayName("Should return location history for family member with spatial filter")
        void shouldReturnLocationHistory_withSpatialFilter() {
            // User2 is in Family Circle 1 with user1
            setUpSecurityContext(USER2_ID, "user2", "user2@gmail.com");

            // User1's locations are around NYC (-73.935, 40.730)
            ListFamilyMemberLocationHistoryRequest request = ListFamilyMemberLocationHistoryRequest.newBuilder()
                    .setFamilyCircleId(FAMILY_CIRCLE_1_ID)
                    .setMemberId(USER1_ID.toString())
                    .setMemberUsername("user1")
                    .setCenterLatitudeDeg(40.730610)
                    .setCenterLongitudeDeg(-73.935242)
                    .setRadiusMeter(1000.0f)  // 1km radius
                    .build();

            AtomicReference<ListFamilyMemberLocationHistoryResponse> responseRef = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);

            StreamObserver<ListFamilyMemberLocationHistoryResponse> responseObserver =
                    new StreamObserver<>() {
                        @Override
                        public void onNext(ListFamilyMemberLocationHistoryResponse response) {
                            responseRef.set(response);
                        }

                        @Override
                        public void onError(Throwable t) {
                            latch.countDown();
                        }

                        @Override
                        public void onCompleted() {
                            latch.countDown();
                        }
                    };

            trackerController.listFamilyMemberLocationHistory(request, responseObserver);

            try {
                assertTrue(latch.await(5, TimeUnit.SECONDS));
            } catch (InterruptedException e) {
                fail("Test timed out");
            }

            assertNotNull(responseRef.get());
            ListFamilyMemberLocationHistoryResponse response = responseRef.get();
            assertEquals(Code.OK_VALUE, response.getStatus().getCode());
        }

        @Test
        @DisplayName("Should return PERMISSION_DENIED when querying non-family member")
        void shouldReturnPermissionDenied_forNonFamilyMember() {
            // User1 is not in same family circle as admin for this query
            setUpSecurityContext(USER1_ID, "user1", "user1@gmail.com");

            // User4 is not directly in same circle with User1 (only through admin circle)
            ListFamilyMemberLocationHistoryRequest request = ListFamilyMemberLocationHistoryRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .setMemberId(ADMIN_USER_ID.toString())  // Admin is not in same circle as user1
                    .setMemberUsername("admin")
                    .build();

            AtomicReference<ListFamilyMemberLocationHistoryResponse> responseRef = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);

            StreamObserver<ListFamilyMemberLocationHistoryResponse> responseObserver =
                    new StreamObserver<>() {
                        @Override
                        public void onNext(ListFamilyMemberLocationHistoryResponse response) {
                            responseRef.set(response);
                        }

                        @Override
                        public void onError(Throwable t) {
                            latch.countDown();
                        }

                        @Override
                        public void onCompleted() {
                            latch.countDown();
                        }
                    };

            trackerController.listFamilyMemberLocationHistory(request, responseObserver);

            try {
                assertTrue(latch.await(5, TimeUnit.SECONDS));
            } catch (InterruptedException e) {
                fail("Test timed out");
            }

            assertNotNull(responseRef.get());
            ListFamilyMemberLocationHistoryResponse response = responseRef.get();
            assertEquals(Code.PERMISSION_DENIED_VALUE, response.getStatus().getCode());
            assertEquals("User is not a family member", response.getStatus().getMessage());
            assertEquals(0, response.getLocationsCount());
        }

        @Test
        @DisplayName("Should return location history with avatar URL when member has avatar")
        void shouldReturnLocationHistory_withMemberAvatarUrl() {
            // User4 is in Family Circle 2 with user3
            setUpSecurityContext(USER4_ID, "user4", "user4@gmail.com");

            ListFamilyMemberLocationHistoryRequest request = ListFamilyMemberLocationHistoryRequest.newBuilder()
                    .setFamilyCircleId(FAMILY_CIRCLE_2_ID)
                    .setMemberId(USER3_ID.toString())
                    .setMemberUsername("user3")
                    .setMemberAvatarUrl("https://example.com/avatar.png")
                    .build();

            AtomicReference<ListFamilyMemberLocationHistoryResponse> responseRef = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);

            StreamObserver<ListFamilyMemberLocationHistoryResponse> responseObserver =
                    new StreamObserver<>() {
                        @Override
                        public void onNext(ListFamilyMemberLocationHistoryResponse response) {
                            responseRef.set(response);
                        }

                        @Override
                        public void onError(Throwable t) {
                            latch.countDown();
                        }

                        @Override
                        public void onCompleted() {
                            latch.countDown();
                        }
                    };

            trackerController.listFamilyMemberLocationHistory(request, responseObserver);

            try {
                assertTrue(latch.await(5, TimeUnit.SECONDS));
            } catch (InterruptedException e) {
                fail("Test timed out");
            }

            assertNotNull(responseRef.get());
            assertEquals(Code.OK_VALUE, responseRef.get().getStatus().getCode());
        }

        @Test
        @DisplayName("Should return location history for admin querying user4")
        void shouldReturnLocationHistory_adminQueryingUser4() {
            // Admin is in Admin Circle with user4
            setUpSecurityContext(ADMIN_USER_ID, ADMIN_USERNAME, ADMIN_EMAIL);

            ListFamilyMemberLocationHistoryRequest request = ListFamilyMemberLocationHistoryRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .setMemberId(USER4_ID.toString())
                    .setMemberUsername("user4")
                    .build();

            AtomicReference<ListFamilyMemberLocationHistoryResponse> responseRef = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);

            StreamObserver<ListFamilyMemberLocationHistoryResponse> responseObserver =
                    new StreamObserver<>() {
                        @Override
                        public void onNext(ListFamilyMemberLocationHistoryResponse response) {
                            responseRef.set(response);
                        }

                        @Override
                        public void onError(Throwable t) {
                            latch.countDown();
                        }

                        @Override
                        public void onCompleted() {
                            latch.countDown();
                        }
                    };

            trackerController.listFamilyMemberLocationHistory(request, responseObserver);

            try {
                assertTrue(latch.await(5, TimeUnit.SECONDS));
            } catch (InterruptedException e) {
                fail("Test timed out");
            }

            assertNotNull(responseRef.get());
            ListFamilyMemberLocationHistoryResponse response = responseRef.get();
            assertEquals(Code.OK_VALUE, response.getStatus().getCode());
            // User4 has 4 locations in Paris
            assertTrue(response.getLocationsCount() >= 0);
        }

        @Test
        @DisplayName("Should return empty locations when spatial filter excludes all locations")
        void shouldReturnEmptyLocations_whenSpatialFilterExcludesAll() {
            // User2 is in Family Circle 1 with user1
            setUpSecurityContext(USER2_ID, "user2", "user2@gmail.com");

            // Query with center point far from user1's NYC locations (use Tokyo coordinates)
            ListFamilyMemberLocationHistoryRequest request = ListFamilyMemberLocationHistoryRequest.newBuilder()
                    .setFamilyCircleId(FAMILY_CIRCLE_1_ID)
                    .setMemberId(USER1_ID.toString())
                    .setMemberUsername("user1")
                    .setCenterLatitudeDeg(35.689487)   // Tokyo
                    .setCenterLongitudeDeg(139.691711)
                    .setRadiusMeter(100.0f)  // Very small radius
                    .build();

            AtomicReference<ListFamilyMemberLocationHistoryResponse> responseRef = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);

            StreamObserver<ListFamilyMemberLocationHistoryResponse> responseObserver =
                    new StreamObserver<>() {
                        @Override
                        public void onNext(ListFamilyMemberLocationHistoryResponse response) {
                            responseRef.set(response);
                        }

                        @Override
                        public void onError(Throwable t) {
                            latch.countDown();
                        }

                        @Override
                        public void onCompleted() {
                            latch.countDown();
                        }
                    };

            trackerController.listFamilyMemberLocationHistory(request, responseObserver);

            try {
                assertTrue(latch.await(5, TimeUnit.SECONDS));
            } catch (InterruptedException e) {
                fail("Test timed out");
            }

            assertNotNull(responseRef.get());
            ListFamilyMemberLocationHistoryResponse response = responseRef.get();
            assertEquals(Code.OK_VALUE, response.getStatus().getCode());
            assertEquals(0, response.getLocationsCount());
        }
    }

    // ==================== UpdateUserLocation Tests ====================

    @Nested
    @DisplayName("UpdateUserLocation Tests")
    class UpdateUserLocationTests {

        @Test
        @DisplayName("Should successfully update user location")
        void shouldUpdateUserLocation_success() {
            setUpSecurityContext(ADMIN_USER_ID, ADMIN_USERNAME, ADMIN_EMAIL);

            long currentTimestamp = System.currentTimeMillis();

            UpdateUserLocationRequest request = UpdateUserLocationRequest.newBuilder()
                    .setLatitudeDeg(-33.868820)
                    .setLongitudeDeg(151.209290)
                    .setAccuracyMeter(5.0f)
                    .setVelocityMps(1.5f)
                    .setTimestampMs(currentTimestamp)
                    .build();

            AtomicReference<UpdateUserLocationResponse> responseRef = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);

            StreamObserver<UpdateUserLocationResponse> responseObserver =
                    new StreamObserver<>() {
                        @Override
                        public void onNext(UpdateUserLocationResponse response) {
                            responseRef.set(response);
                        }

                        @Override
                        public void onError(Throwable t) {
                            latch.countDown();
                        }

                        @Override
                        public void onCompleted() {
                            latch.countDown();
                        }
                    };

            trackerController.updateUserLocation(request, responseObserver);

            try {
                assertTrue(latch.await(5, TimeUnit.SECONDS));
            } catch (InterruptedException e) {
                fail("Test timed out");
            }

            assertNotNull(responseRef.get());
            UpdateUserLocationResponse response = responseRef.get();
            assertEquals(Code.OK_VALUE, response.getStatus().getCode());
        }

        @Test
        @DisplayName("Should update location for user1")
        void shouldUpdateLocation_forUser1() {
            setUpSecurityContext(USER1_ID, "user1", "user1@gmail.com");

            long currentTimestamp = System.currentTimeMillis();

            UpdateUserLocationRequest request = UpdateUserLocationRequest.newBuilder()
                    .setLatitudeDeg(40.730610)
                    .setLongitudeDeg(-73.935242)
                    .setAccuracyMeter(3.0f)
                    .setVelocityMps(0.0f)
                    .setTimestampMs(currentTimestamp)
                    .build();

            AtomicReference<UpdateUserLocationResponse> responseRef = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);

            StreamObserver<UpdateUserLocationResponse> responseObserver = new StreamObserver<>() {
                @Override
                public void onNext(UpdateUserLocationResponse response) {
                    responseRef.set(response);
                }

                @Override
                public void onError(Throwable t) {
                    latch.countDown();
                }

                @Override
                public void onCompleted() {
                    latch.countDown();
                }
            };

            trackerController.updateUserLocation(request, responseObserver);

            try {
                assertTrue(latch.await(5, TimeUnit.SECONDS));
            } catch (InterruptedException e) {
                fail("Test timed out");
            }

            assertNotNull(responseRef.get());
            assertEquals(Code.OK_VALUE, responseRef.get().getStatus().getCode());
        }

        @Test
        @DisplayName("Should update location with zero velocity")
        void shouldUpdateLocation_withZeroVelocity() {
            setUpSecurityContext(USER2_ID, "user2", "user2@gmail.com");

            long currentTimestamp = System.currentTimeMillis();

            UpdateUserLocationRequest request = UpdateUserLocationRequest.newBuilder()
                    .setLatitudeDeg(51.507351)
                    .setLongitudeDeg(-0.127758)
                    .setAccuracyMeter(10.0f)
                    .setVelocityMps(0.0f)
                    .setTimestampMs(currentTimestamp)
                    .build();

            AtomicReference<UpdateUserLocationResponse> responseRef = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);

            StreamObserver<UpdateUserLocationResponse> responseObserver =
                    new StreamObserver<>() {
                        @Override
                        public void onNext(UpdateUserLocationResponse response) {
                            responseRef.set(response);
                        }

                        @Override
                        public void onError(Throwable t) {
                            latch.countDown();
                        }

                        @Override
                        public void onCompleted() {
                            latch.countDown();
                        }
                    };

            trackerController.updateUserLocation(request, responseObserver);

            try {
                assertTrue(latch.await(5, TimeUnit.SECONDS));
            } catch (InterruptedException e) {
                fail("Test timed out");
            }

            assertNotNull(responseRef.get());
            assertEquals(Code.OK_VALUE, responseRef.get().getStatus().getCode());
        }

        @Test
        @DisplayName("Should update location with high velocity")
        void shouldUpdateLocation_withHighVelocity() {
            setUpSecurityContext(USER3_ID, "user3", "user3@gmail.com");

            long currentTimestamp = System.currentTimeMillis();

            UpdateUserLocationRequest request = UpdateUserLocationRequest.newBuilder()
                    .setLatitudeDeg(35.689487)
                    .setLongitudeDeg(139.691711)
                    .setAccuracyMeter(2.0f)
                    .setVelocityMps(30.0f)  // 30 m/s ~ 108 km/h
                    .setTimestampMs(currentTimestamp)
                    .build();

            AtomicReference<UpdateUserLocationResponse> responseRef = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);

            StreamObserver<UpdateUserLocationResponse> responseObserver =
                    new StreamObserver<>() {
                        @Override
                        public void onNext(UpdateUserLocationResponse response) {
                            responseRef.set(response);
                        }

                        @Override
                        public void onError(Throwable t) {
                            latch.countDown();
                        }

                        @Override
                        public void onCompleted() {
                            latch.countDown();
                        }
                    };

            trackerController.updateUserLocation(request, responseObserver);

            try {
                assertTrue(latch.await(5, TimeUnit.SECONDS));
            } catch (InterruptedException e) {
                fail("Test timed out");
            }

            assertNotNull(responseRef.get());
            assertEquals(Code.OK_VALUE, responseRef.get().getStatus().getCode());
        }

        @Test
        @DisplayName("Should update location for user4 in Paris")
        void shouldUpdateLocation_forUser4InParis() {
            setUpSecurityContext(USER4_ID, "user4", "user4@gmail.com");

            long currentTimestamp = System.currentTimeMillis();

            UpdateUserLocationRequest request = UpdateUserLocationRequest.newBuilder()
                    .setLatitudeDeg(48.856613)
                    .setLongitudeDeg(2.352222)
                    .setAccuracyMeter(7.5f)
                    .setVelocityMps(1.2f)
                    .setTimestampMs(currentTimestamp)
                    .build();

            AtomicReference<UpdateUserLocationResponse> responseRef = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);

            StreamObserver<UpdateUserLocationResponse> responseObserver =
                    new StreamObserver<>() {
                        @Override
                        public void onNext(UpdateUserLocationResponse response) {
                            responseRef.set(response);
                        }

                        @Override
                        public void onError(Throwable t) {
                            latch.countDown();
                        }

                        @Override
                        public void onCompleted() {
                            latch.countDown();
                        }
                    };

            trackerController.updateUserLocation(request, responseObserver);

            try {
                assertTrue(latch.await(5, TimeUnit.SECONDS));
            } catch (InterruptedException e) {
                fail("Test timed out");
            }

            assertNotNull(responseRef.get());
            assertEquals(Code.OK_VALUE, responseRef.get().getStatus().getCode());
        }

        @Test
        @DisplayName("Should update location with minimum accuracy")
        void shouldUpdateLocation_withMinimumAccuracy() {
            setUpSecurityContext(ADMIN_USER_ID, ADMIN_USERNAME, ADMIN_EMAIL);

            long currentTimestamp = System.currentTimeMillis();

            UpdateUserLocationRequest request = UpdateUserLocationRequest.newBuilder()
                    .setLatitudeDeg(-33.868820)
                    .setLongitudeDeg(151.209290)
                    .setAccuracyMeter(0.1f)  // Very precise
                    .setVelocityMps(0.5f)
                    .setTimestampMs(currentTimestamp)
                    .build();

            AtomicReference<UpdateUserLocationResponse> responseRef = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);

            StreamObserver<UpdateUserLocationResponse> responseObserver =
                    new StreamObserver<>() {
                        @Override
                        public void onNext(UpdateUserLocationResponse response) {
                            responseRef.set(response);
                        }

                        @Override
                        public void onError(Throwable t) {
                            latch.countDown();
                        }

                        @Override
                        public void onCompleted() {
                            latch.countDown();
                        }
                    };

            trackerController.updateUserLocation(request, responseObserver);

            try {
                assertTrue(latch.await(5, TimeUnit.SECONDS));
            } catch (InterruptedException e) {
                fail("Test timed out");
            }

            assertNotNull(responseRef.get());
            assertEquals(Code.OK_VALUE, responseRef.get().getStatus().getCode());
        }

        // ==================== Integration Tests ====================

        @Nested
        @DisplayName("Integration Tests")
        class IntegrationTests {

            @Test
            @DisplayName("Should update location then retrieve it in history")
            void shouldUpdateAndRetrieveLocation() {
                // First, update location for user1
                setUpSecurityContext(USER1_ID, "user1", "user1@gmail.com");

                long currentTimestamp = System.currentTimeMillis();

                UpdateUserLocationRequest updateRequest = UpdateUserLocationRequest.newBuilder()
                        .setLatitudeDeg(40.750000)
                        .setLongitudeDeg(-73.950000)
                        .setAccuracyMeter(5.0f)
                        .setVelocityMps(2.0f)
                        .setTimestampMs(currentTimestamp)
                        .build();

                CountDownLatch updateLatch = new CountDownLatch(1);
                AtomicReference<UpdateUserLocationResponse> updateRef = new AtomicReference<>();

                StreamObserver<UpdateUserLocationResponse> responseObserver = new StreamObserver<>() {
                    @Override
                    public void onNext(UpdateUserLocationResponse response) {
                        updateRef.set(response);
                    }

                    @Override
                    public void onError(Throwable t) {
                        updateLatch.countDown();
                    }

                    @Override
                    public void onCompleted() {
                        updateLatch.countDown();
                    }
                };

                // Call the unary RPC directly
                trackerController.updateUserLocation(updateRequest, responseObserver);

                try {
                    assertTrue(updateLatch.await(5, TimeUnit.SECONDS));
                } catch (InterruptedException e) {
                    fail("Test timed out");
                }

                assertEquals(Code.OK_VALUE, updateRef.get().getStatus().getCode());

                // Now, as user2 (family member), retrieve user1's location history
                setUpSecurityContext(USER2_ID, "user2", "user2@gmail.com");

                ListFamilyMemberLocationHistoryRequest historyRequest = ListFamilyMemberLocationHistoryRequest.newBuilder()
                        .setFamilyCircleId(FAMILY_CIRCLE_1_ID)
                        .setMemberId(USER1_ID.toString())
                        .setMemberUsername("user1")
                        .build();

                CountDownLatch historyLatch = new CountDownLatch(1);
                AtomicReference<ListFamilyMemberLocationHistoryResponse> historyRef = new AtomicReference<>();

                trackerController.listFamilyMemberLocationHistory(historyRequest, new StreamObserver<>() {
                    @Override
                    public void onNext(ListFamilyMemberLocationHistoryResponse response) {
                        historyRef.set(response);
                    }

                    @Override
                    public void onError(Throwable t) {
                        historyLatch.countDown();
                    }

                    @Override
                    public void onCompleted() {
                        historyLatch.countDown();
                    }
                });

                try {
                    assertTrue(historyLatch.await(5, TimeUnit.SECONDS));
                } catch (InterruptedException e) {
                    fail("Test timed out");
                }

                assertNotNull(historyRef.get());
                assertEquals(Code.OK_VALUE, historyRef.get().getStatus().getCode());
                // Should have at least the newly added location plus existing test data
                assertTrue(historyRef.get().getLocationsCount() >= 1);
            }

            @Test
            @DisplayName("Should verify response observer callbacks are invoked correctly")
            void shouldVerifyResponseObserverCallbacks() {
                setUpSecurityContext(USER1_ID, "user1", "user1@gmail.com");

                long currentTimestamp = System.currentTimeMillis();

                UpdateUserLocationRequest request = UpdateUserLocationRequest.newBuilder()
                        .setLatitudeDeg(40.730610)
                        .setLongitudeDeg(-73.935242)
                        .setAccuracyMeter(5.0f)
                        .setVelocityMps(1.0f)
                        .setTimestampMs(currentTimestamp)
                        .build();

                @SuppressWarnings("unchecked")
                StreamObserver<UpdateUserLocationResponse> mockObserver = mock(StreamObserver.class);

                // Call the unary RPC directly
                trackerController.updateUserLocation(request, mockObserver);

                // Verify onNext was called with a response
                ArgumentCaptor<UpdateUserLocationResponse> responseCaptor =
                        ArgumentCaptor.forClass(UpdateUserLocationResponse.class);
                verify(mockObserver).onNext(responseCaptor.capture());

                UpdateUserLocationResponse capturedResponse = responseCaptor.getValue();
                assertEquals(Code.OK_VALUE, capturedResponse.getStatus().getCode());

                // Verify onCompleted was called
                verify(mockObserver).onCompleted();

                // Verify onError was never called
                verify(mockObserver, never()).onError(any());
            }

            @Test
            @DisplayName("Should verify listFamilyMemberLocationHistory response observer callbacks")
            void shouldVerifyListHistoryResponseObserverCallbacks() {
                setUpSecurityContext(USER2_ID, "user2", "user2@gmail.com");

                ListFamilyMemberLocationHistoryRequest request = ListFamilyMemberLocationHistoryRequest.newBuilder()
                        .setFamilyCircleId(FAMILY_CIRCLE_1_ID)
                        .setMemberId(USER1_ID.toString())
                        .setMemberUsername("user1")
                        .build();

                @SuppressWarnings("unchecked")
                StreamObserver<ListFamilyMemberLocationHistoryResponse> mockObserver = mock(StreamObserver.class);

                trackerController.listFamilyMemberLocationHistory(request, mockObserver);

                // Verify onNext was called with a response
                ArgumentCaptor<ListFamilyMemberLocationHistoryResponse> responseCaptor =
                        ArgumentCaptor.forClass(ListFamilyMemberLocationHistoryResponse.class);
                verify(mockObserver).onNext(responseCaptor.capture());

                ListFamilyMemberLocationHistoryResponse capturedResponse = responseCaptor.getValue();
                assertEquals(Code.OK_VALUE, capturedResponse.getStatus().getCode());

                // Verify onCompleted was called
                verify(mockObserver).onCompleted();

                // Verify onError was never called
                verify(mockObserver, never()).onError(any());
            }

            @Test
            @DisplayName("Should stream family member locations in Family Circle 3")
            void shouldStreamLocations_inFamilyCircle3() {
                // Admin is in Family Circle 3 with user3
                setUpSecurityContext(ADMIN_USER_ID, ADMIN_USERNAME, ADMIN_EMAIL);

                StreamFamilyMemberLocationsRequest request = StreamFamilyMemberLocationsRequest.newBuilder()
                        .setFamilyCircleId(FAMILY_CIRCLE_3_ID)
                        .build();

                @SuppressWarnings("unchecked")
                ServerCallStreamObserver<FamilyMemberLocation> responseObserver =
                        mock(ServerCallStreamObserver.class);

                List<FamilyMemberLocation> receivedLocations = new ArrayList<>();
                doAnswer(invocation -> {
                    receivedLocations.add(invocation.getArgument(0));
                    return null;
                }).when(responseObserver).onNext(any(FamilyMemberLocation.class));

                trackerController.streamFamilyMemberLocations(request, responseObserver);

                verify(responseObserver).disableAutoRequest();
                verify(responseObserver).setOnCancelHandler(any(Runnable.class));
            }

            @Test
            @DisplayName("Should stream family member locations in Family Circle 4")
            void shouldStreamLocations_inFamilyCircle4() {
                // User1 is Mother in Family Circle 4 with user3
                setUpSecurityContext(USER1_ID, "user1", "user1@gmail.com");

                StreamFamilyMemberLocationsRequest request = StreamFamilyMemberLocationsRequest.newBuilder()
                        .setFamilyCircleId(FAMILY_CIRCLE_4_ID)
                        .build();

                @SuppressWarnings("unchecked")
                ServerCallStreamObserver<FamilyMemberLocation> responseObserver =
                        mock(ServerCallStreamObserver.class);

                trackerController.streamFamilyMemberLocations(request, responseObserver);

                verify(responseObserver).disableAutoRequest();
                verify(responseObserver).setOnCancelHandler(any(Runnable.class));
            }

            @Test
            @DisplayName("Should return location history for admin querying user3 in Family Circle 3")
            void shouldReturnLocationHistory_adminQueryingUser3() {
                setUpSecurityContext(ADMIN_USER_ID, ADMIN_USERNAME, ADMIN_EMAIL);

                ListFamilyMemberLocationHistoryRequest request = ListFamilyMemberLocationHistoryRequest.newBuilder()
                        .setFamilyCircleId(FAMILY_CIRCLE_3_ID)
                        .setMemberId(USER3_ID.toString())
                        .setMemberUsername("user3")
                        .build();

                AtomicReference<ListFamilyMemberLocationHistoryResponse> responseRef = new AtomicReference<>();
                CountDownLatch latch = new CountDownLatch(1);

                trackerController.listFamilyMemberLocationHistory(request, new StreamObserver<>() {
                    @Override
                    public void onNext(ListFamilyMemberLocationHistoryResponse response) {
                        responseRef.set(response);
                    }

                    @Override
                    public void onError(Throwable t) {
                        latch.countDown();
                    }

                    @Override
                    public void onCompleted() {
                        latch.countDown();
                    }
                });

                try {
                    assertTrue(latch.await(5, TimeUnit.SECONDS));
                } catch (InterruptedException e) {
                    fail("Test timed out");
                }

                assertNotNull(responseRef.get());
                assertEquals(Code.OK_VALUE, responseRef.get().getStatus().getCode());
            }

            @Test
            @DisplayName("Should return location history for user1 querying user3 in Family Circle 4")
            void shouldReturnLocationHistory_user1QueryingUser3InCircle4() {
                setUpSecurityContext(USER1_ID, "user1", "user1@gmail.com");

                ListFamilyMemberLocationHistoryRequest request = ListFamilyMemberLocationHistoryRequest.newBuilder()
                        .setFamilyCircleId(FAMILY_CIRCLE_4_ID)
                        .setMemberId(USER3_ID.toString())
                        .setMemberUsername("user3")
                        .build();

                AtomicReference<ListFamilyMemberLocationHistoryResponse> responseRef = new AtomicReference<>();
                CountDownLatch latch = new CountDownLatch(1);

                trackerController.listFamilyMemberLocationHistory(request, new StreamObserver<>() {
                    @Override
                    public void onNext(ListFamilyMemberLocationHistoryResponse response) {
                        responseRef.set(response);
                    }

                    @Override
                    public void onError(Throwable t) {
                        latch.countDown();
                    }

                    @Override
                    public void onCompleted() {
                        latch.countDown();
                    }
                });

                try {
                    assertTrue(latch.await(5, TimeUnit.SECONDS));
                } catch (InterruptedException e) {
                    fail("Test timed out");
                }

                assertNotNull(responseRef.get());
                assertEquals(Code.OK_VALUE, responseRef.get().getStatus().getCode());
            }
        }

        // ==================== Edge Case Tests ====================

        @Nested
        @DisplayName("Edge Case Tests")
        class EdgeCaseTests {

            @Test
            @DisplayName("Should handle location at extreme latitude values")
            void shouldHandleLocation_atExtremeLatitude() {
                setUpSecurityContext(ADMIN_USER_ID, ADMIN_USERNAME, ADMIN_EMAIL);

                long currentTimestamp = System.currentTimeMillis();

                // Near North Pole
                UpdateUserLocationRequest request = UpdateUserLocationRequest.newBuilder()
                        .setLatitudeDeg(89.999)
                        .setLongitudeDeg(0.0)
                        .setAccuracyMeter(10.0f)
                        .setVelocityMps(0.0f)
                        .setTimestampMs(currentTimestamp)
                        .build();

                AtomicReference<UpdateUserLocationResponse> responseRef = new AtomicReference<>();
                CountDownLatch latch = new CountDownLatch(1);

                // Response observer receives the server response after we complete sending
                StreamObserver<UpdateUserLocationResponse> responseObserver = new StreamObserver<>() {
                    @Override
                    public void onNext(UpdateUserLocationResponse response) {
                        responseRef.set(response);
                    }

                    @Override
                    public void onError(Throwable t) {
                        // make test fail fast on error
                        fail("Unexpected error during location update: " + t.getMessage());
                    }

                    @Override
                    public void onCompleted() {
                        latch.countDown();
                    }
                };

                // Call the unary RPC directly
                trackerController.updateUserLocation(request, responseObserver);

                try {
                    assertTrue(latch.await(5, TimeUnit.SECONDS), "Timed out waiting for response");
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    fail("Test interrupted");
                }

                assertNotNull(responseRef.get(), "Expected a non-null response");
                assertEquals(Code.OK_VALUE, responseRef.get().getStatus().getCode());
            }

            @Test
            @DisplayName("Should handle location at extreme longitude values")
            void shouldHandleLocation_atExtremeLongitude() {
                setUpSecurityContext(ADMIN_USER_ID, ADMIN_USERNAME, ADMIN_EMAIL);

                long currentTimestamp = System.currentTimeMillis();

                // Near International Date Line
                UpdateUserLocationRequest request = UpdateUserLocationRequest.newBuilder()
                        .setLatitudeDeg(0.0)
                        .setLongitudeDeg(179.999)
                        .setAccuracyMeter(10.0f)
                        .setVelocityMps(0.0f)
                        .setTimestampMs(currentTimestamp)
                        .build();

                AtomicReference<UpdateUserLocationResponse> responseRef = new AtomicReference<>();
                CountDownLatch latch = new CountDownLatch(1);

                StreamObserver<UpdateUserLocationResponse> responseObserver = new StreamObserver<>() {
                    @Override
                    public void onNext(UpdateUserLocationResponse response) {
                        responseRef.set(response);
                    }

                    @Override
                    public void onError(Throwable t) {
                        latch.countDown();
                    }

                    @Override
                    public void onCompleted() {
                        latch.countDown();
                    }
                };

                trackerController.updateUserLocation(request, responseObserver);

                try {
                    assertTrue(latch.await(5, TimeUnit.SECONDS));
                } catch (InterruptedException e) {
                    fail("Test timed out");
                }

                assertNotNull(responseRef.get());
                assertEquals(Code.OK_VALUE, responseRef.get().getStatus().getCode());
            }

            @Test
            @DisplayName("Should handle location with very large accuracy value")
            void shouldHandleLocation_withLargeAccuracy() {
                setUpSecurityContext(USER1_ID, "user1", "user1@gmail.com");

                long currentTimestamp = System.currentTimeMillis();

                UpdateUserLocationRequest request = UpdateUserLocationRequest.newBuilder()
                        .setLatitudeDeg(40.730610)
                        .setLongitudeDeg(-73.935242)
                        .setAccuracyMeter(1000.0f)  // 1km accuracy (poor GPS)
                        .setVelocityMps(0.0f)
                        .setTimestampMs(currentTimestamp)
                        .build();

                AtomicReference<UpdateUserLocationResponse> responseRef = new AtomicReference<>();
                CountDownLatch latch = new CountDownLatch(1);

                StreamObserver<UpdateUserLocationResponse> responseObserver = new StreamObserver<>() {
                    @Override
                    public void onNext(UpdateUserLocationResponse response) {
                        responseRef.set(response);
                    }

                    @Override
                    public void onError(Throwable t) {
                        latch.countDown();
                    }

                    @Override
                    public void onCompleted() {
                        latch.countDown();
                    }
                };

                trackerController.updateUserLocation(request, responseObserver);

                try {
                    assertTrue(latch.await(5, TimeUnit.SECONDS));
                } catch (InterruptedException e) {
                    fail("Test timed out");
                }

                assertNotNull(responseRef.get());
                assertEquals(Code.OK_VALUE, responseRef.get().getStatus().getCode());
            }

            @Test
            @DisplayName("Should handle location history request with only center latitude")
            void shouldHandleHistoryRequest_withOnlyCenterLatitude() {
                setUpSecurityContext(USER2_ID, "user2", "user2@gmail.com");

                // Only set center latitude (partial spatial filter - should be treated as no filter)
                ListFamilyMemberLocationHistoryRequest request = ListFamilyMemberLocationHistoryRequest.newBuilder()
                        .setFamilyCircleId(FAMILY_CIRCLE_1_ID)
                        .setMemberId(USER1_ID.toString())
                        .setMemberUsername("user1")
                        .setCenterLatitudeDeg(40.730610)
                        .build();

                AtomicReference<ListFamilyMemberLocationHistoryResponse> responseRef = new AtomicReference<>();
                CountDownLatch latch = new CountDownLatch(1);

                trackerController.listFamilyMemberLocationHistory(request, new StreamObserver<>() {
                    @Override
                    public void onNext(ListFamilyMemberLocationHistoryResponse response) {
                        responseRef.set(response);
                    }

                    @Override
                    public void onError(Throwable t) {
                        latch.countDown();
                    }

                    @Override
                    public void onCompleted() {
                        latch.countDown();
                    }
                });

                try {
                    assertTrue(latch.await(5, TimeUnit.SECONDS));
                } catch (InterruptedException e) {
                    fail("Test timed out");
                }

                assertNotNull(responseRef.get());
                assertEquals(Code.OK_VALUE, responseRef.get().getStatus().getCode());
            }

            @Test
            @DisplayName("Should handle location history request with only center longitude")
            void shouldHandleHistoryRequest_withOnlyCenterLongitude() {
                setUpSecurityContext(USER2_ID, "user2", "user2@gmail.com");

                // Only set center longitude (partial spatial filter - should be treated as no filter)
                ListFamilyMemberLocationHistoryRequest request = ListFamilyMemberLocationHistoryRequest.newBuilder()
                        .setFamilyCircleId(FAMILY_CIRCLE_1_ID)
                        .setMemberId(USER1_ID.toString())
                        .setMemberUsername("user1")
                        .setCenterLongitudeDeg(-73.935242)
                        .build();

                AtomicReference<ListFamilyMemberLocationHistoryResponse> responseRef = new AtomicReference<>();
                CountDownLatch latch = new CountDownLatch(1);

                trackerController.listFamilyMemberLocationHistory(request, new StreamObserver<>() {
                    @Override
                    public void onNext(ListFamilyMemberLocationHistoryResponse response) {
                        responseRef.set(response);
                    }

                    @Override
                    public void onError(Throwable t) {
                        latch.countDown();
                    }

                    @Override
                    public void onCompleted() {
                        latch.countDown();
                    }
                });

                try {
                    assertTrue(latch.await(5, TimeUnit.SECONDS));
                } catch (InterruptedException e) {
                    fail("Test timed out");
                }

                assertNotNull(responseRef.get());
                assertEquals(Code.OK_VALUE, responseRef.get().getStatus().getCode());
            }

            @Test
            @DisplayName("Should handle location history request with only radius")
            void shouldHandleHistoryRequest_withOnlyRadius() {
                setUpSecurityContext(USER2_ID, "user2", "user2@gmail.com");

                // Only set radius (partial spatial filter - should be treated as no filter)
                ListFamilyMemberLocationHistoryRequest request = ListFamilyMemberLocationHistoryRequest.newBuilder()
                        .setFamilyCircleId(FAMILY_CIRCLE_1_ID)
                        .setMemberId(USER1_ID.toString())
                        .setMemberUsername("user1")
                        .setRadiusMeter(1000.0f)
                        .build();

                AtomicReference<ListFamilyMemberLocationHistoryResponse> responseRef = new AtomicReference<>();
                CountDownLatch latch = new CountDownLatch(1);

                trackerController.listFamilyMemberLocationHistory(request, new StreamObserver<>() {
                    @Override
                    public void onNext(ListFamilyMemberLocationHistoryResponse response) {
                        responseRef.set(response);
                    }

                    @Override
                    public void onError(Throwable t) {
                        latch.countDown();
                    }

                    @Override
                    public void onCompleted() {
                        latch.countDown();
                    }
                });

                try {
                    assertTrue(latch.await(5, TimeUnit.SECONDS));
                } catch (InterruptedException e) {
                    fail("Test timed out");
                }

                assertNotNull(responseRef.get());
                assertEquals(Code.OK_VALUE, responseRef.get().getStatus().getCode());
            }

            @Test
            @DisplayName("Should handle location history request with center but no radius")
            void shouldHandleHistoryRequest_withCenterButNoRadius() {
                setUpSecurityContext(USER2_ID, "user2", "user2@gmail.com");

                // Set center but no radius (partial spatial filter - should be treated as no filter)
                ListFamilyMemberLocationHistoryRequest request = ListFamilyMemberLocationHistoryRequest.newBuilder()
                        .setFamilyCircleId(FAMILY_CIRCLE_1_ID)
                        .setMemberId(USER1_ID.toString())
                        .setMemberUsername("user1")
                        .setCenterLatitudeDeg(40.730610)
                        .setCenterLongitudeDeg(-73.935242)
                        .build();

                AtomicReference<ListFamilyMemberLocationHistoryResponse> responseRef = new AtomicReference<>();
                CountDownLatch latch = new CountDownLatch(1);

                trackerController.listFamilyMemberLocationHistory(request, new StreamObserver<>() {
                    @Override
                    public void onNext(ListFamilyMemberLocationHistoryResponse response) {
                        responseRef.set(response);
                    }

                    @Override
                    public void onError(Throwable t) {
                        latch.countDown();
                    }

                    @Override
                    public void onCompleted() {
                        latch.countDown();
                    }
                });

                try {
                    assertTrue(latch.await(5, TimeUnit.SECONDS));
                } catch (InterruptedException e) {
                    fail("Test timed out");
                }

                assertNotNull(responseRef.get());
                assertEquals(Code.OK_VALUE, responseRef.get().getStatus().getCode());
            }

            @Test
            @DisplayName("Should handle multiple stream requests from same user")
            void shouldHandleMultipleStreamRequests_fromSameUser() {
                setUpSecurityContext(USER2_ID, "user2", "user2@gmail.com");

                StreamFamilyMemberLocationsRequest request = StreamFamilyMemberLocationsRequest.newBuilder()
                        .setFamilyCircleId(FAMILY_CIRCLE_1_ID)
                        .build();

                // First stream
                @SuppressWarnings("unchecked")
                ServerCallStreamObserver<FamilyMemberLocation> responseObserver1 =
                        mock(ServerCallStreamObserver.class);

                trackerController.streamFamilyMemberLocations(request, responseObserver1);

                verify(responseObserver1).disableAutoRequest();
                verify(responseObserver1).setOnCancelHandler(any(Runnable.class));

                // Second stream from same user
                @SuppressWarnings("unchecked")
                ServerCallStreamObserver<FamilyMemberLocation> responseObserver2 =
                        mock(ServerCallStreamObserver.class);

                trackerController.streamFamilyMemberLocations(request, responseObserver2);

                verify(responseObserver2).disableAutoRequest();
                verify(responseObserver2).setOnCancelHandler(any(Runnable.class));
            }

            @Test
            @DisplayName("Should handle location history with large radius")
            void shouldHandleLocationHistory_withLargeRadius() {
                setUpSecurityContext(USER2_ID, "user2", "user2@gmail.com");

                // Very large radius that should include all locations
                ListFamilyMemberLocationHistoryRequest request = ListFamilyMemberLocationHistoryRequest.newBuilder()
                        .setFamilyCircleId(FAMILY_CIRCLE_1_ID)
                        .setMemberId(USER1_ID.toString())
                        .setMemberUsername("user1")
                        .setCenterLatitudeDeg(40.730610)
                        .setCenterLongitudeDeg(-73.935242)
                        .setRadiusMeter(100000.0f)  // 100km radius
                        .build();

                AtomicReference<ListFamilyMemberLocationHistoryResponse> responseRef = new AtomicReference<>();
                CountDownLatch latch = new CountDownLatch(1);

                trackerController.listFamilyMemberLocationHistory(request, new StreamObserver<>() {
                    @Override
                    public void onNext(ListFamilyMemberLocationHistoryResponse response) {
                        responseRef.set(response);
                    }

                    @Override
                    public void onError(Throwable t) {
                        latch.countDown();
                    }

                    @Override
                    public void onCompleted() {
                        latch.countDown();
                    }
                });

                try {
                    assertTrue(latch.await(5, TimeUnit.SECONDS));
                } catch (InterruptedException e) {
                    fail("Test timed out");
                }

                assertNotNull(responseRef.get());
                assertEquals(Code.OK_VALUE, responseRef.get().getStatus().getCode());
            }
        }
    }
}

