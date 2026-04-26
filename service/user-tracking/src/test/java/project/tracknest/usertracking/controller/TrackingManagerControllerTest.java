package project.tracknest.usertracking.controller;

import com.google.rpc.Code;
import com.google.rpc.Status;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import project.tracknest.usertracking.domain.trackingmanager.service.TrackingManagerService;
import project.tracknest.usertracking.proto.lib.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static project.tracknest.usertracking.utils.SecuritySetup.*;

@ExtendWith(MockitoExtension.class)
class TrackingManagerControllerTest {

    @Mock
    private TrackingManagerService service;

    @InjectMocks
    private TrackingManagerController controller;

    @BeforeEach
    void setUp() {
        setUpSecurityContext();
    }

    private static Status okStatus() {
        return Status.newBuilder().setCode(Code.OK_VALUE).build();
    }

    // ==================== CreateFamilyCircle Tests ====================

    @Nested
    @DisplayName("CreateFamilyCircle Tests")
    class CreateFamilyCircleTests {

        @Test
        void createFamilyCircle_success() {
            CreateFamilyCircleRequest req = CreateFamilyCircleRequest.newBuilder()
                    .setName("My Family Circle")
                    .build();
            CreateFamilyCircleResponse res = CreateFamilyCircleResponse.newBuilder()
                    .setStatus(okStatus())
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .build();
            when(service.createFamilyCircle(ADMIN_USER_ID, req)).thenReturn(res);
            @SuppressWarnings("unchecked")
            StreamObserver<CreateFamilyCircleResponse> obs = mock(StreamObserver.class);

            controller.createFamilyCircle(req, obs);

            verify(obs).onNext(res);
            verify(obs).onCompleted();
            verify(obs, never()).onError(any());
        }

        @Test
        void createFamilyCircle_missingName_returnsError() {
            CreateFamilyCircleRequest req = CreateFamilyCircleRequest.newBuilder().build();
            CreateFamilyCircleResponse errorRes = CreateFamilyCircleResponse.newBuilder()
                    .setStatus(Status.newBuilder().setCode(Code.INVALID_ARGUMENT_VALUE).build())
                    .build();
            when(service.createFamilyCircle(ADMIN_USER_ID, req)).thenReturn(errorRes);
            @SuppressWarnings("unchecked")
            StreamObserver<CreateFamilyCircleResponse> obs = mock(StreamObserver.class);

            controller.createFamilyCircle(req, obs);

            ArgumentCaptor<CreateFamilyCircleResponse> captor =
                    ArgumentCaptor.forClass(CreateFamilyCircleResponse.class);
            verify(obs).onNext(captor.capture());
            assertNotEquals(Code.OK_VALUE, captor.getValue().getStatus().getCode());
            verify(obs).onCompleted();
        }
    }

    // ==================== ListFamilyCircles Tests ====================

    @Nested
    @DisplayName("ListFamilyCircles Tests")
    class ListFamilyCirclesTests {

        @Test
        void listFamilyCircles_success() {
            ListFamilyCirclesRequest req = ListFamilyCirclesRequest.newBuilder().build();
            ListFamilyCircleResponse res = ListFamilyCircleResponse.newBuilder().build();
            when(service.listFamilyCircles(ADMIN_USER_ID, req)).thenReturn(res);
            @SuppressWarnings("unchecked")
            StreamObserver<ListFamilyCircleResponse> obs = mock(StreamObserver.class);

            controller.listFamilyCircles(req, obs);

            verify(obs).onNext(res);
            verify(obs).onCompleted();
        }
    }

    // ==================== DeleteFamilyCircle Tests ====================

    @Nested
    @DisplayName("DeleteFamilyCircle Tests")
    class DeleteFamilyCircleTests {

        @Test
        void deleteFamilyCircle_success() {
            DeleteFamilyCircleRequest req = DeleteFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID).build();
            DeleteFamilyCircleResponse res = DeleteFamilyCircleResponse.newBuilder()
                    .setStatus(okStatus()).build();
            when(service.deleteFamilyCircle(ADMIN_USER_ID, req)).thenReturn(res);
            @SuppressWarnings("unchecked")
            StreamObserver<DeleteFamilyCircleResponse> obs = mock(StreamObserver.class);

            controller.deleteFamilyCircle(req, obs);

            verify(obs).onNext(res);
            verify(obs).onCompleted();
        }

        @Test
        void deleteFamilyCircle_notFound() {
            DeleteFamilyCircleRequest req = DeleteFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId("00000000-0000-0000-0000-000000000000").build();
            DeleteFamilyCircleResponse notFound = DeleteFamilyCircleResponse.newBuilder()
                    .setStatus(Status.newBuilder().setCode(Code.PERMISSION_DENIED_VALUE).build()).build();
            when(service.deleteFamilyCircle(ADMIN_USER_ID, req)).thenReturn(notFound);
            @SuppressWarnings("unchecked")
            StreamObserver<DeleteFamilyCircleResponse> obs = mock(StreamObserver.class);

            controller.deleteFamilyCircle(req, obs);

            verify(obs).onNext(notFound);
            verify(obs).onCompleted();
        }
    }

    // ==================== UpdateFamilyCircle Tests ====================

    @Nested
    @DisplayName("UpdateFamilyCircle Tests")
    class UpdateFamilyCircleTests {

        @Test
        void updateFamilyCircle_success() {
            UpdateFamilyCircleRequest req = UpdateFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .setName("Updated Circle Name!!").build();
            UpdateFamilyCircleResponse res = UpdateFamilyCircleResponse.newBuilder()
                    .setStatus(okStatus()).build();
            when(service.updateFamilyCircle(ADMIN_USER_ID, req)).thenReturn(res);
            @SuppressWarnings("unchecked")
            StreamObserver<UpdateFamilyCircleResponse> obs = mock(StreamObserver.class);

            controller.updateFamilyCircle(req, obs);

            verify(obs).onNext(res);
            verify(obs).onCompleted();
        }

        @Test
        void updateFamilyCircle_notFound() {
            UpdateFamilyCircleRequest req = UpdateFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId("00000000-0000-0000-0000-000000000000")
                    .setName("Updated Circle Name!!").build();
            UpdateFamilyCircleResponse notFound = UpdateFamilyCircleResponse.newBuilder()
                    .setStatus(Status.newBuilder().setCode(Code.NOT_FOUND_VALUE).build()).build();
            when(service.updateFamilyCircle(ADMIN_USER_ID, req)).thenReturn(notFound);
            @SuppressWarnings("unchecked")
            StreamObserver<UpdateFamilyCircleResponse> obs = mock(StreamObserver.class);

            controller.updateFamilyCircle(req, obs);

            verify(obs).onNext(notFound);
            verify(obs).onCompleted();
        }
    }

    // ==================== UpdateFamilyRole Tests ====================

    @Nested
    @DisplayName("UpdateFamilyRole Tests")
    class UpdateFamilyRoleTests {

        @Test
        void updateFamilyRole_success() {
            UpdateFamilyRoleRequest req = UpdateFamilyRoleRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .setFamilyRole("parent").build();
            UpdateFamilyRoleResponse res = UpdateFamilyRoleResponse.newBuilder()
                    .setStatus(okStatus()).build();
            when(service.updateFamilyRole(ADMIN_USER_ID, req)).thenReturn(res);
            @SuppressWarnings("unchecked")
            StreamObserver<UpdateFamilyRoleResponse> obs = mock(StreamObserver.class);

            controller.updateFamilyRole(req, obs);

            verify(obs).onNext(res);
            verify(obs).onCompleted();
        }
    }

    // ==================== CreateParticipationPermission Tests ====================

    @Nested
    @DisplayName("CreateParticipationPermission Tests")
    class CreateParticipationPermissionTests {

        @Test
        void createParticipationPermission_success() {
            CreateParticipationPermissionRequest req = CreateParticipationPermissionRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID).build();
            CreateParticipationPermissionResponse res = CreateParticipationPermissionResponse.newBuilder()
                    .setStatus(okStatus())
                    .setOtp("ABC123xyz456abcd")
                    .setCreatedAtMs(System.currentTimeMillis())
                    .build();
            when(service.createParticipationPermission(ADMIN_USER_ID, req)).thenReturn(res);
            @SuppressWarnings("unchecked")
            StreamObserver<CreateParticipationPermissionResponse> obs = mock(StreamObserver.class);

            controller.createParticipationPermission(req, obs);

            ArgumentCaptor<CreateParticipationPermissionResponse> captor =
                    ArgumentCaptor.forClass(CreateParticipationPermissionResponse.class);
            verify(obs).onNext(captor.capture());
            assertFalse(captor.getValue().getOtp().isBlank());
            verify(obs).onCompleted();
        }

        @Test
        void createParticipationPermission_thenUseOtpToParticipate_success() {
            // Part 1: create OTP
            CreateParticipationPermissionRequest createReq = CreateParticipationPermissionRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID).build();
            CreateParticipationPermissionResponse createRes = CreateParticipationPermissionResponse.newBuilder()
                    .setStatus(okStatus())
                    .setOtp("VALID0TP12345678")
                    .build();
            when(service.createParticipationPermission(ADMIN_USER_ID, createReq)).thenReturn(createRes);

            @SuppressWarnings("unchecked")
            StreamObserver<CreateParticipationPermissionResponse> createObs = mock(StreamObserver.class);
            controller.createParticipationPermission(createReq, createObs);
            verify(createObs).onNext(createRes);

            // Part 2: use OTP
            setUpSecurityContext(USER1_ID, "user1", "user1@gmail.com");
            ParticipateInFamilyCircleRequest participateReq = ParticipateInFamilyCircleRequest.newBuilder()
                    .setOtp("VALID0TP12345678").build();
            ParticipateInFamilyCircleResponse participateRes = ParticipateInFamilyCircleResponse.newBuilder()
                    .setStatus(okStatus()).build();
            when(service.participateInFamilyCircle(USER1_ID, participateReq)).thenReturn(participateRes);

            @SuppressWarnings("unchecked")
            StreamObserver<ParticipateInFamilyCircleResponse> participateObs = mock(StreamObserver.class);
            controller.participateInFamilyCircle(participateReq, participateObs);
            verify(participateObs).onNext(participateRes);
            verify(participateObs).onCompleted();
        }
    }

    // ==================== LeaveFamilyCircle Tests ====================

    @Nested
    @DisplayName("LeaveFamilyCircle Tests")
    class LeaveFamilyCircleTests {

        @Test
        void leaveFamilyCircle_success() {
            LeaveFamilyCircleRequest req = LeaveFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(FAMILY_CIRCLE_1_ID).build();
            LeaveFamilyCircleResponse res = LeaveFamilyCircleResponse.newBuilder()
                    .setStatus(okStatus()).build();
            when(service.leaveFamilyCircle(ADMIN_USER_ID, req)).thenReturn(res);
            @SuppressWarnings("unchecked")
            StreamObserver<LeaveFamilyCircleResponse> obs = mock(StreamObserver.class);

            controller.leaveFamilyCircle(req, obs);

            verify(obs).onNext(res);
            verify(obs).onCompleted();
        }

        @Test
        void leaveFamilyCircle_isAdmin_shouldFail() {
            LeaveFamilyCircleRequest req = LeaveFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID).build();
            LeaveFamilyCircleResponse failRes = LeaveFamilyCircleResponse.newBuilder()
                    .setStatus(Status.newBuilder().setCode(Code.FAILED_PRECONDITION_VALUE).build()).build();
            when(service.leaveFamilyCircle(ADMIN_USER_ID, req)).thenReturn(failRes);
            @SuppressWarnings("unchecked")
            StreamObserver<LeaveFamilyCircleResponse> obs = mock(StreamObserver.class);

            controller.leaveFamilyCircle(req, obs);

            ArgumentCaptor<LeaveFamilyCircleResponse> captor =
                    ArgumentCaptor.forClass(LeaveFamilyCircleResponse.class);
            verify(obs).onNext(captor.capture());
            assertEquals(Code.FAILED_PRECONDITION_VALUE, captor.getValue().getStatus().getCode());
        }
    }

    // ==================== AssignFamilyCircleAdmin Tests ====================

    @Nested
    @DisplayName("AssignFamilyCircleAdmin Tests")
    class AssignFamilyCircleAdminTests {

        @Test
        void assignFamilyCircleAdmin_success() {
            AssignFamilyCircleAdminRequest req = AssignFamilyCircleAdminRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .setMemberId(USER1_ID.toString()).build();
            AssignFamilyCircleAdminResponse res = AssignFamilyCircleAdminResponse.newBuilder()
                    .setStatus(okStatus()).build();
            when(service.assignFamilyCircleAdmin(ADMIN_USER_ID, req)).thenReturn(res);
            @SuppressWarnings("unchecked")
            StreamObserver<AssignFamilyCircleAdminResponse> obs = mock(StreamObserver.class);

            controller.assignFamilyCircleAdmin(req, obs);

            verify(obs).onNext(res);
            verify(obs).onCompleted();
        }
    }

    // ==================== RemoveMemberFromFamilyCircle Tests ====================

    @Nested
    @DisplayName("RemoveMemberFromFamilyCircle Tests")
    class RemoveMemberFromFamilyCircleTests {

        @Test
        void removeMemberFromFamilyCircle_success() {
            RemoveMemberFromFamilyCircleRequest req = RemoveMemberFromFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .setMemberId(USER1_ID.toString()).build();
            RemoveMemberFromFamilyCircleResponse res = RemoveMemberFromFamilyCircleResponse.newBuilder()
                    .setStatus(okStatus()).build();
            when(service.removeMemberFromFamilyCircle(ADMIN_USER_ID, req)).thenReturn(res);
            @SuppressWarnings("unchecked")
            StreamObserver<RemoveMemberFromFamilyCircleResponse> obs = mock(StreamObserver.class);

            controller.removeMemberFromFamilyCircle(req, obs);

            verify(obs).onNext(res);
            verify(obs).onCompleted();
        }

        @Test
        void removeMemberFromFamilyCircle_notFound() {
            RemoveMemberFromFamilyCircleRequest req = RemoveMemberFromFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .setMemberId("00000000-0000-0000-0000-000000000000").build();
            RemoveMemberFromFamilyCircleResponse notFound = RemoveMemberFromFamilyCircleResponse.newBuilder()
                    .setStatus(Status.newBuilder().setCode(Code.NOT_FOUND_VALUE).build()).build();
            when(service.removeMemberFromFamilyCircle(ADMIN_USER_ID, req)).thenReturn(notFound);
            @SuppressWarnings("unchecked")
            StreamObserver<RemoveMemberFromFamilyCircleResponse> obs = mock(StreamObserver.class);

            controller.removeMemberFromFamilyCircle(req, obs);

            verify(obs).onNext(notFound);
            verify(obs).onCompleted();
        }

        @Test
        void removeMemberFromFamilyCircle_removeAdmin_shouldFail() {
            RemoveMemberFromFamilyCircleRequest req = RemoveMemberFromFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .setMemberId(ADMIN_USER_ID.toString()).build();
            RemoveMemberFromFamilyCircleResponse failRes = RemoveMemberFromFamilyCircleResponse.newBuilder()
                    .setStatus(Status.newBuilder().setCode(Code.FAILED_PRECONDITION_VALUE).build()).build();
            when(service.removeMemberFromFamilyCircle(ADMIN_USER_ID, req)).thenReturn(failRes);
            @SuppressWarnings("unchecked")
            StreamObserver<RemoveMemberFromFamilyCircleResponse> obs = mock(StreamObserver.class);

            controller.removeMemberFromFamilyCircle(req, obs);

            verify(obs).onNext(failRes);
            verify(obs).onCompleted();
        }
    }

    // ==================== ListFamilyCircleMembers Tests ====================

    @Nested
    @DisplayName("ListFamilyCircleMembers Tests")
    class ListFamilyCircleMembersTests {

        @Test
        void listFamilyCircleMembers_success() {
            ListFamilyCircleMembersRequest req = ListFamilyCircleMembersRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID).build();
            ListFamilyCircleMembersResponse res = ListFamilyCircleMembersResponse.newBuilder()
                    .setStatus(okStatus()).build();
            when(service.listFamilyCircleMembers(ADMIN_USER_ID, req)).thenReturn(res);
            @SuppressWarnings("unchecked")
            StreamObserver<ListFamilyCircleMembersResponse> obs = mock(StreamObserver.class);

            controller.listFamilyCircleMembers(req, obs);

            verify(obs).onNext(res);
            verify(obs).onCompleted();
        }
    }
}
