package project.tracknest.usertracking.controller;

import com.google.rpc.Code;
import io.grpc.stub.StreamObserver;
import jakarta.validation.ConstraintViolationException;
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

import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static project.tracknest.usertracking.utils.SecuritySetup.*;

@SpringBootTest
@ExtendWith(MockitoExtension.class)
@Transactional
class TrackingManagerControllerTest {
    @Autowired
    private TrackingManagerController trackingManagerController;

    @BeforeEach
    public void setUp() {
        setUpSecurityContext();
    }

    @Nested
    @DisplayName("CreateFamilyCircle")
    class CreateFamilyCircleTests {
        @Test
        void createFamilyCircle_success() throws Exception {
            CreateFamilyCircleRequest request = CreateFamilyCircleRequest.newBuilder()
                    .setName("Test Circle")
                    .setFamilyRole("Father")
                    .build();
            AtomicReference<CreateFamilyCircleResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            trackingManagerController.createFamilyCircle(request, new StreamObserver<>() {
                public void onNext(CreateFamilyCircleResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(Code.OK_VALUE, ref.get().getStatus().getCode());
            assertNotNull(ref.get().getFamilyCircleId());
        }
        @Test
        void createFamilyCircle_missingName_shouldThrowValidationException() {
            CreateFamilyCircleRequest request = CreateFamilyCircleRequest.newBuilder()
                    .setFamilyRole("Father").build();
            assertThrows(ConstraintViolationException.class, () -> {
                CountDownLatch latch = new CountDownLatch(1);
                trackingManagerController.createFamilyCircle(request, new StreamObserver<>() {
                    public void onNext(CreateFamilyCircleResponse value) {}
                    public void onError(Throwable t) { latch.countDown(); }
                    public void onCompleted() { latch.countDown(); }
                });
                latch.await(5, TimeUnit.SECONDS);
            });
        }
    }

    @Nested
    @DisplayName("ListFamilyCircles")
    class ListFamilyCirclesTests {
        @Test
        void listFamilyCircles_success() throws Exception {
            ListFamilyCirclesRequest request = ListFamilyCirclesRequest.newBuilder().setPageSize(10).build();
            AtomicReference<ListFamilyCircleResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            trackingManagerController.listFamilyCircles(request, new StreamObserver<>() {
                public void onNext(ListFamilyCircleResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertTrue(ref.get().getFamilyCirclesCount() >= 0);
        }
    }

    @Nested
    @DisplayName("DeleteFamilyCircle")
    class DeleteFamilyCircleTests {
        @Test
        void deleteFamilyCircle_success() throws Exception {
            // Use a circle where admin is admin (from your test data)
            DeleteFamilyCircleRequest request = DeleteFamilyCircleRequest.newBuilder().setFamilyCircleId(ADMIN_CIRCLE_ID).build();
            AtomicReference<DeleteFamilyCircleResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            trackingManagerController.deleteFamilyCircle(request, new StreamObserver<>() {
                public void onNext(DeleteFamilyCircleResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(Code.OK_VALUE, ref.get().getStatus().getCode());
        }
        @Test
        void deleteFamilyCircle_notFound() throws Exception {
            DeleteFamilyCircleRequest request = DeleteFamilyCircleRequest.newBuilder().setFamilyCircleId("00000000-0000-0000-0000-000000000000").build();
            AtomicReference<DeleteFamilyCircleResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            trackingManagerController.deleteFamilyCircle(request, new StreamObserver<>() {
                public void onNext(DeleteFamilyCircleResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(Code.PERMISSION_DENIED_VALUE, ref.get().getStatus().getCode());
        }
    }

    @Nested
    @DisplayName("UpdateFamilyCircle")
    class UpdateFamilyCircleTests {
        @Test
        void updateFamilyCircle_success() throws Exception {
            UpdateFamilyCircleRequest request = UpdateFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .setName("Updated Name").build();
            AtomicReference<UpdateFamilyCircleResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            trackingManagerController.updateFamilyCircle(request, new StreamObserver<>() {
                public void onNext(UpdateFamilyCircleResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(Code.OK_VALUE, ref.get().getStatus().getCode());
        }
        @Test
        void updateFamilyCircle_notFound() throws Exception {
            UpdateFamilyCircleRequest request = UpdateFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId("00000000-0000-0000-0000-000000000000").setName("Name").build();
            AtomicReference<UpdateFamilyCircleResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            trackingManagerController.updateFamilyCircle(request, new StreamObserver<>() {
                public void onNext(UpdateFamilyCircleResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(Code.PERMISSION_DENIED_VALUE, ref.get().getStatus().getCode());
        }
    }

    @Nested
    @DisplayName("UpdateFamilyRole")
    class UpdateFamilyRoleTests {
        @Test
        void updateFamilyRole_success() throws Exception {
            UpdateFamilyRoleRequest request = UpdateFamilyRoleRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .setFamilyRole("Father").build();
            AtomicReference<UpdateFamilyRoleResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            trackingManagerController.updateFamilyRole(request, new StreamObserver<>() {
                public void onNext(UpdateFamilyRoleResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(Code.OK_VALUE, ref.get().getStatus().getCode());
        }
    }

    @Nested
    @DisplayName("CreateParticipationPermission")
    class CreateParticipationPermissionTests {
        @Test
        void createParticipationPermission_success() throws Exception {
            CreateParticipationPermissionRequest request = CreateParticipationPermissionRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID).build();
            AtomicReference<CreateParticipationPermissionResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            trackingManagerController.createParticipationPermission(request, new StreamObserver<>() {
                public void onNext(CreateParticipationPermissionResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(Code.OK_VALUE, ref.get().getStatus().getCode());
            assertNotNull(ref.get().getOtp());
        }

        @Test
        void createParticipationPermission_thenUseOtpToParticipate_success() throws Exception {
            // First, create the permission to get the OTP
            CreateParticipationPermissionRequest createRequest = CreateParticipationPermissionRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID).build();
            AtomicReference<CreateParticipationPermissionResponse> createRef = new AtomicReference<>();
            CountDownLatch createLatch = new CountDownLatch(1);
            trackingManagerController.createParticipationPermission(createRequest, new StreamObserver<>() {
                public void onNext(CreateParticipationPermissionResponse value) { createRef.set(value); }
                public void onError(Throwable t) { createLatch.countDown(); }
                public void onCompleted() { createLatch.countDown(); }
            });
            assertTrue(createLatch.await(5, TimeUnit.SECONDS));
            assertNotNull(createRef.get());
            assertEquals(Code.OK_VALUE, createRef.get().getStatus().getCode());
            String otp = createRef.get().getOtp();

            // Now use the OTP to participate
            setUpSecurityContext(USER4_ID, "user4", "user4@gmail.com"); // Switch to another user
            ParticipateInFamilyCircleRequest participateRequest = ParticipateInFamilyCircleRequest.newBuilder()
                    .setOtp(otp).build();
            AtomicReference<ParticipateInFamilyCircleResponse> participateRef = new AtomicReference<>();
            CountDownLatch participateLatch = new CountDownLatch(1);
            trackingManagerController.participateInFamilyCircle(participateRequest, new StreamObserver<>() {
                public void onNext(ParticipateInFamilyCircleResponse value) { participateRef.set(value); }
                public void onError(Throwable t) { participateLatch.countDown(); }
                public void onCompleted() { participateLatch.countDown(); }
            });
            assertTrue(participateLatch.await(5, TimeUnit.SECONDS));
            assertNotNull(participateRef.get());
            assertEquals(Code.OK_VALUE, participateRef.get().getStatus().getCode());
        }
    }

    @Nested
    @DisplayName("LeaveFamilyCircle")
    class LeaveFamilyCircleTests {
        @Test
        void leaveFamilyCircle_success() throws Exception {
            LeaveFamilyCircleRequest request = LeaveFamilyCircleRequest.newBuilder().setFamilyCircleId(FAMILY_CIRCLE_3_ID).build();
            AtomicReference<LeaveFamilyCircleResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            trackingManagerController.leaveFamilyCircle(request, new StreamObserver<>() {
                public void onNext(LeaveFamilyCircleResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(Code.OK_VALUE, ref.get().getStatus().getCode());
        }

        @Test
        void leaveFamilyCircle_isAdmin_shouldFail() throws Exception {
            LeaveFamilyCircleRequest request = LeaveFamilyCircleRequest.newBuilder().setFamilyCircleId(ADMIN_CIRCLE_ID).build();
            AtomicReference<LeaveFamilyCircleResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            trackingManagerController.leaveFamilyCircle(request, new StreamObserver<>() {
                public void onNext(LeaveFamilyCircleResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(Code.FAILED_PRECONDITION_VALUE, ref.get().getStatus().getCode());
        }
    }

    @Nested
    @DisplayName("AssignFamilyCircleAdmin")
    class AssignFamilyCircleAdminTests {
        @Test
        void assignFamilyCircleAdmin_success() throws Exception {
            String memberId = USER3_ID.toString(); // user2
            AssignFamilyCircleAdminRequest request = AssignFamilyCircleAdminRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .setMemberId(memberId).build();
            AtomicReference<AssignFamilyCircleAdminResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            trackingManagerController.assignFamilyCircleAdmin(request, new StreamObserver<>() {
                public void onNext(AssignFamilyCircleAdminResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(Code.OK_VALUE, ref.get().getStatus().getCode());
            assertEquals(memberId, ref.get().getMemberId());
        }
    }

    @Nested
    @DisplayName("RemoveMemberFromFamilyCircle")
    class RemoveMemberFromFamilyCircleTests {
        @Test
        void removeMemberFromFamilyCircle_success() throws Exception {
            String memberId = USER3_ID.toString(); // user3
            RemoveMemberFromFamilyCircleRequest request = RemoveMemberFromFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .setMemberId(memberId).build();
            AtomicReference<RemoveMemberFromFamilyCircleResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            trackingManagerController.removeMemberFromFamilyCircle(request, new StreamObserver<>() {
                public void onNext(RemoveMemberFromFamilyCircleResponse value) {
                    ref.set(value);
                }

                public void onError(Throwable t) {
                    latch.countDown();
                }

                public void onCompleted() {
                    latch.countDown();
                }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(Code.OK_VALUE, ref.get().getStatus().getCode());
            assertEquals(memberId, ref.get().getMemberId());
        }

        @Test
        void removeMemberFromFamilyCircle_notFound() throws Exception {
            String memberId = "00000000-0000-0000-0000-000000000000";
            RemoveMemberFromFamilyCircleRequest request = RemoveMemberFromFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .setMemberId(memberId).build();
            AtomicReference<RemoveMemberFromFamilyCircleResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            trackingManagerController.removeMemberFromFamilyCircle(request, new StreamObserver<>() {
                public void onNext(RemoveMemberFromFamilyCircleResponse value) {
                    ref.set(value);
                }

                public void onError(Throwable t) {
                    latch.countDown();
                }

                public void onCompleted() {
                    latch.countDown();
                }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(Code.NOT_FOUND_VALUE, ref.get().getStatus().getCode());
        }

        @Test
        void removeMemberFromFamilyCircle_removeAdmin_shouldFail() throws Exception {
            String memberId = ADMIN_USER_ID.toString();
            RemoveMemberFromFamilyCircleRequest request = RemoveMemberFromFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .setMemberId(memberId).build();
            AtomicReference<RemoveMemberFromFamilyCircleResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            trackingManagerController.removeMemberFromFamilyCircle(request, new StreamObserver<>() {
                public void onNext(RemoveMemberFromFamilyCircleResponse value) {
                    ref.set(value);
                }

                public void onError(Throwable t) {
                    latch.countDown();
                }

                public void onCompleted() {
                    latch.countDown();
                }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(Code.FAILED_PRECONDITION_VALUE, ref.get().getStatus().getCode());
        }
    }
}