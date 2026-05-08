package project.tracknest.usertracking.domain.trackingmanager.impl;

import com.google.rpc.Code;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.test.util.ReflectionTestUtils;
import project.tracknest.usertracking.core.datatype.PageToken;
import project.tracknest.usertracking.core.entity.FamilyCircle;
import project.tracknest.usertracking.core.entity.FamilyCircleMember;
import project.tracknest.usertracking.core.entity.User;
import project.tracknest.usertracking.core.utils.PageTokenCodec;
import project.tracknest.usertracking.proto.lib.*;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TrackingManagerServiceImplTest {

    @Mock StringRedisTemplate redisTemplate;
    @Mock TrackingManagerFamilyCircleRepository familyCircleRepository;
    @Mock TrackingManagerFamilyCircleMemberRepository familyCircleMemberRepository;
    @Mock TrackingManagerUserRepository userRepository;
    @Mock EntityManager entityManager;

    @InjectMocks TrackingManagerServiceImpl service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "entityManager", entityManager);
    }

    private static final UUID USER_ID = UUID.fromString("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    private static final UUID CIRCLE_ID = UUID.fromString("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    private static final UUID MEMBER_ID = UUID.fromString("cccccccc-cccc-4ccc-8ccc-cccccccccccc");

    private User buildUser(UUID id) {
        return User.builder()
                .id(id)
                .username("user-" + id.toString().substring(0, 4))
                .connected(false)
                .lastActive(OffsetDateTime.now(ZoneOffset.UTC))
                .build();
    }

    private FamilyCircle buildCircle(UUID id) {
        return FamilyCircle.builder()
                .id(id)
                .name("Test Circle Name")
                .createdAt(OffsetDateTime.now(ZoneOffset.UTC))
                .build();
    }

    private FamilyCircleMember buildMember(UUID circleId, UUID memberId, boolean isAdmin) {
        return FamilyCircleMember.builder()
                .id(FamilyCircleMember.FamilyCircleMemberId.builder()
                        .familyCircleId(circleId)
                        .memberId(memberId)
                        .build())
                .isAdmin(isAdmin)
                .role("parent")
                .member(buildUser(memberId))
                .build();
    }

    // ── createFamilyCircle ────────────────────────────────────────────────────

    @Nested
    @DisplayName("createFamilyCircle Tests")
    class CreateFamilyCircleTests {

        @Test
        void should_createCircle_andReturnId() {
            FamilyCircle saved = buildCircle(CIRCLE_ID);
            when(familyCircleRepository.saveAndFlush(any(FamilyCircle.class))).thenReturn(saved);
            doNothing().when(entityManager).refresh(any());
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser(USER_ID)));

            CreateFamilyCircleRequest req = CreateFamilyCircleRequest.newBuilder()
                    .setName("Test Circle Name")
                    .build();

            CreateFamilyCircleResponse res = service.createFamilyCircle(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            assertEquals(CIRCLE_ID.toString(), res.getFamilyCircleId());
            verify(familyCircleMemberRepository).save(argThat(m -> m.isAdmin() &&
                    m.getId().getMemberId().equals(USER_ID)));
        }

        @Test
        void should_throwRuntimeException_whenUserNotFound() {
            FamilyCircle saved = buildCircle(CIRCLE_ID);
            when(familyCircleRepository.saveAndFlush(any(FamilyCircle.class))).thenReturn(saved);
            doNothing().when(entityManager).refresh(any());
            when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

            CreateFamilyCircleRequest req = CreateFamilyCircleRequest.newBuilder()
                    .setName("Test Circle Name")
                    .build();

            assertThrows(RuntimeException.class, () -> service.createFamilyCircle(USER_ID, req));
        }
    }

    // ── listFamilyCircles ─────────────────────────────────────────────────────

    @Nested
    @DisplayName("listFamilyCircles Tests")
    class ListFamilyCirclesTests {

        @Test
        void should_returnFirstPage_withoutNextToken() {
            FamilyCircle circle = buildCircle(CIRCLE_ID);
            Slice<FamilyCircle> slice = new SliceImpl<>(List.of(circle), PageRequest.ofSize(32), false);
            when(familyCircleRepository.findFirstPageByUserId(eq(USER_ID), any())).thenReturn(slice);
            when(familyCircleMemberRepository.findByCircleIdsAndMemberId(List.of(CIRCLE_ID), USER_ID))
                    .thenReturn(List.of(buildMember(CIRCLE_ID, USER_ID, false)));

            ListFamilyCirclesRequest req = ListFamilyCirclesRequest.newBuilder().build();
            ListFamilyCircleResponse res = service.listFamilyCircles(USER_ID, req);

            assertEquals(1, res.getFamilyCirclesCount());
            assertTrue(res.getNextPageToken().isBlank());
        }

        @Test
        void should_returnNextPageToken_whenHasMore() {
            FamilyCircle circle = buildCircle(CIRCLE_ID);
            Slice<FamilyCircle> slice = new SliceImpl<>(List.of(circle), PageRequest.ofSize(2), true);
            when(familyCircleRepository.findFirstPageByUserId(eq(USER_ID), any())).thenReturn(slice);
            when(familyCircleMemberRepository.findByCircleIdsAndMemberId(List.of(CIRCLE_ID), USER_ID))
                    .thenReturn(List.of(buildMember(CIRCLE_ID, USER_ID, false)));

            ListFamilyCirclesRequest req = ListFamilyCirclesRequest.newBuilder().setPageSize(2).build();
            ListFamilyCircleResponse res = service.listFamilyCircles(USER_ID, req);

            assertFalse(res.getNextPageToken().isBlank());
        }

        @Test
        void should_fetchNextPage_whenCursorProvided() {
            PageToken token = new PageToken(System.currentTimeMillis(), CIRCLE_ID.toString());
            String encoded = PageTokenCodec.encode(token);
            FamilyCircle circle = buildCircle(CIRCLE_ID);
            Slice<FamilyCircle> slice = new SliceImpl<>(List.of(circle), PageRequest.ofSize(32), false);
            when(familyCircleRepository.findNextPageByUserId(eq(USER_ID), any(), any(), any()))
                    .thenReturn(slice);
            when(familyCircleMemberRepository.findByCircleIdsAndMemberId(List.of(CIRCLE_ID), USER_ID))
                    .thenReturn(List.of(buildMember(CIRCLE_ID, USER_ID, false)));

            ListFamilyCirclesRequest req = ListFamilyCirclesRequest.newBuilder()
                    .setPageToken(encoded).build();
            ListFamilyCircleResponse res = service.listFamilyCircles(USER_ID, req);

            verify(familyCircleRepository).findNextPageByUserId(eq(USER_ID), any(), any(), any());
            assertEquals(1, res.getFamilyCirclesCount());
        }

        @Test
        void should_populateFamilyRole_andIsAdmin_whenUserIsAdmin() {
            FamilyCircle circle = buildCircle(CIRCLE_ID);
            Slice<FamilyCircle> slice = new SliceImpl<>(List.of(circle), PageRequest.ofSize(32), false);
            when(familyCircleRepository.findFirstPageByUserId(eq(USER_ID), any())).thenReturn(slice);
            when(familyCircleMemberRepository.findByCircleIdsAndMemberId(List.of(CIRCLE_ID), USER_ID))
                    .thenReturn(List.of(buildMember(CIRCLE_ID, USER_ID, true)));

            ListFamilyCircleResponse res = service.listFamilyCircles(USER_ID,
                    ListFamilyCirclesRequest.newBuilder().build());

            FamilyCircleInfo info = res.getFamilyCircles(0);
            assertTrue(info.getIsAdmin());
            assertEquals("parent", info.getFamilyRole());
        }

        @Test
        void should_populateFamilyRole_andNotAdmin_whenUserIsNotAdmin() {
            FamilyCircle circle = buildCircle(CIRCLE_ID);
            Slice<FamilyCircle> slice = new SliceImpl<>(List.of(circle), PageRequest.ofSize(32), false);
            when(familyCircleRepository.findFirstPageByUserId(eq(USER_ID), any())).thenReturn(slice);
            when(familyCircleMemberRepository.findByCircleIdsAndMemberId(List.of(CIRCLE_ID), USER_ID))
                    .thenReturn(List.of(buildMember(CIRCLE_ID, USER_ID, false)));

            ListFamilyCircleResponse res = service.listFamilyCircles(USER_ID,
                    ListFamilyCirclesRequest.newBuilder().build());

            FamilyCircleInfo info = res.getFamilyCircles(0);
            assertFalse(info.getIsAdmin());
            assertEquals("parent", info.getFamilyRole());
        }

        @Test
        void should_returnEmptyRoleAndNotAdmin_whenMembershipMissing() {
            FamilyCircle circle = buildCircle(CIRCLE_ID);
            Slice<FamilyCircle> slice = new SliceImpl<>(List.of(circle), PageRequest.ofSize(32), false);
            when(familyCircleRepository.findFirstPageByUserId(eq(USER_ID), any())).thenReturn(slice);
            when(familyCircleMemberRepository.findByCircleIdsAndMemberId(List.of(CIRCLE_ID), USER_ID))
                    .thenReturn(List.of());

            ListFamilyCircleResponse res = service.listFamilyCircles(USER_ID,
                    ListFamilyCirclesRequest.newBuilder().build());

            FamilyCircleInfo info = res.getFamilyCircles(0);
            assertFalse(info.getIsAdmin());
            assertTrue(info.getFamilyRole().isBlank());
        }

        @Test
        void should_batchFetchMemberships_forAllCirclesInPage() {
            UUID circle2Id = UUID.fromString("dddddddd-dddd-4ddd-8ddd-dddddddddddd");
            FamilyCircle circle1 = buildCircle(CIRCLE_ID);
            FamilyCircle circle2 = buildCircle(circle2Id);
            Slice<FamilyCircle> slice = new SliceImpl<>(List.of(circle1, circle2), PageRequest.ofSize(32), false);
            when(familyCircleRepository.findFirstPageByUserId(eq(USER_ID), any())).thenReturn(slice);
            when(familyCircleMemberRepository.findByCircleIdsAndMemberId(
                    argThat(ids -> ids.containsAll(List.of(CIRCLE_ID, circle2Id))), eq(USER_ID)))
                    .thenReturn(List.of(
                            buildMember(CIRCLE_ID, USER_ID, true),
                            buildMember(circle2Id, USER_ID, false)));

            ListFamilyCircleResponse res = service.listFamilyCircles(USER_ID,
                    ListFamilyCirclesRequest.newBuilder().build());

            assertEquals(2, res.getFamilyCirclesCount());
            verify(familyCircleMemberRepository, times(1))
                    .findByCircleIdsAndMemberId(anyList(), eq(USER_ID));
        }
    }

    // ── deleteFamilyCircle ────────────────────────────────────────────────────

    @Nested
    @DisplayName("deleteFamilyCircle Tests")
    class DeleteFamilyCircleTests {

        @Test
        void should_deleteCircle_whenUserIsAdmin() {
            FamilyCircle circle = buildCircle(CIRCLE_ID);
            when(familyCircleRepository.findCircleIfAdmin(USER_ID, CIRCLE_ID))
                    .thenReturn(Optional.of(circle));

            DeleteFamilyCircleRequest req = DeleteFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString()).build();
            DeleteFamilyCircleResponse res = service.deleteFamilyCircle(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            verify(familyCircleRepository).delete(circle);
        }

        @Test
        void should_returnPermissionDenied_whenUserNotAdmin() {
            when(familyCircleRepository.findCircleIfAdmin(USER_ID, CIRCLE_ID))
                    .thenReturn(Optional.empty());

            DeleteFamilyCircleRequest req = DeleteFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString()).build();
            DeleteFamilyCircleResponse res = service.deleteFamilyCircle(USER_ID, req);

            assertEquals(Code.PERMISSION_DENIED_VALUE, res.getStatus().getCode());
            verify(familyCircleRepository, never()).delete(any());
        }
    }

    // ── updateFamilyCircle ────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateFamilyCircle Tests")
    class UpdateFamilyCircleTests {

        @Test
        void should_updateName_whenAdminAndValidName() {
            FamilyCircle circle = buildCircle(CIRCLE_ID);
            when(familyCircleRepository.findCircleIfAdmin(USER_ID, CIRCLE_ID))
                    .thenReturn(Optional.of(circle));

            UpdateFamilyCircleRequest req = UpdateFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .setName("Valid New Name!!!!")
                    .build();

            UpdateFamilyCircleResponse res = service.updateFamilyCircle(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            verify(familyCircleRepository).save(circle);
        }

        @Test
        void should_returnPermissionDenied_whenNotAdmin() {
            when(familyCircleRepository.findCircleIfAdmin(USER_ID, CIRCLE_ID))
                    .thenReturn(Optional.empty());

            UpdateFamilyCircleRequest req = UpdateFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .setName("Valid New Name!!!")
                    .build();

            UpdateFamilyCircleResponse res = service.updateFamilyCircle(USER_ID, req);

            assertEquals(Code.PERMISSION_DENIED_VALUE, res.getStatus().getCode());
        }

        @Test
        void should_returnInvalidArgument_whenNameTooShort() {
            FamilyCircle circle = buildCircle(CIRCLE_ID);
            when(familyCircleRepository.findCircleIfAdmin(USER_ID, CIRCLE_ID))
                    .thenReturn(Optional.of(circle));

            UpdateFamilyCircleRequest req = UpdateFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .setName("Short")
                    .build();

            UpdateFamilyCircleResponse res = service.updateFamilyCircle(USER_ID, req);

            assertEquals(Code.INVALID_ARGUMENT_VALUE, res.getStatus().getCode());
        }

        @Test
        void should_returnInvalidArgument_whenNameTooLong() {
            FamilyCircle circle = buildCircle(CIRCLE_ID);
            when(familyCircleRepository.findCircleIfAdmin(USER_ID, CIRCLE_ID))
                    .thenReturn(Optional.of(circle));

            UpdateFamilyCircleRequest req = UpdateFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .setName("a".repeat(51))
                    .build();

            UpdateFamilyCircleResponse res = service.updateFamilyCircle(USER_ID, req);

            assertEquals(Code.INVALID_ARGUMENT_VALUE, res.getStatus().getCode());
        }
    }

    // ── updateFamilyRole ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateFamilyRole Tests")
    class UpdateFamilyRoleTests {

        @Test
        void should_updateRole_whenMemberExists() {
            FamilyCircleMember member = buildMember(CIRCLE_ID, USER_ID, false);
            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.of(member));

            UpdateFamilyRoleRequest req = UpdateFamilyRoleRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .setFamilyRole("child")
                    .build();

            UpdateFamilyRoleResponse res = service.updateFamilyRole(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            assertEquals("child", member.getRole());
        }

        @Test
        void should_returnNotFound_whenMemberAbsent() {
            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.empty());

            UpdateFamilyRoleRequest req = UpdateFamilyRoleRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .setFamilyRole("child")
                    .build();

            UpdateFamilyRoleResponse res = service.updateFamilyRole(USER_ID, req);

            assertEquals(Code.NOT_FOUND_VALUE, res.getStatus().getCode());
        }
    }

    // ── createParticipationPermission ─────────────────────────────────────────

    @Nested
    @DisplayName("createParticipationPermission Tests")
    class CreateParticipationPermissionTests {

        @Test
        @SuppressWarnings("unchecked")
        void should_createOtp_whenUserIsAdmin() {
            FamilyCircleMember admin = buildMember(CIRCLE_ID, USER_ID, true);
            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.of(admin));

            ValueOperations<String, String> valueOps = mock(ValueOperations.class);
            when(redisTemplate.opsForValue()).thenReturn(valueOps);

            CreateParticipationPermissionRequest req = CreateParticipationPermissionRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .build();

            CreateParticipationPermissionResponse res = service.createParticipationPermission(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            assertFalse(res.getOtp().isBlank());
            assertEquals(16, res.getOtp().length());
            verify(valueOps).set(anyString(), eq(CIRCLE_ID.toString()), any());
        }

        @Test
        @SuppressWarnings("unchecked")
        void should_deletePreviousOtp_whenPreviousOtpProvided() {
            FamilyCircleMember admin = buildMember(CIRCLE_ID, USER_ID, true);
            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.of(admin));

            ValueOperations<String, String> valueOps = mock(ValueOperations.class);
            when(redisTemplate.opsForValue()).thenReturn(valueOps);

            CreateParticipationPermissionRequest req = CreateParticipationPermissionRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .setPreviousOtp("old-otp-12345678")
                    .build();

            service.createParticipationPermission(USER_ID, req);

            verify(redisTemplate).delete(contains("old-otp-12345678"));
        }

        @Test
        void should_returnPermissionDenied_whenNotAdmin() {
            FamilyCircleMember nonAdmin = buildMember(CIRCLE_ID, USER_ID, false);
            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.of(nonAdmin));

            CreateParticipationPermissionRequest req = CreateParticipationPermissionRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .build();

            CreateParticipationPermissionResponse res = service.createParticipationPermission(USER_ID, req);

            assertEquals(Code.PERMISSION_DENIED_VALUE, res.getStatus().getCode());
        }

        @Test
        void should_returnPermissionDenied_whenNotMember() {
            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.empty());

            CreateParticipationPermissionRequest req = CreateParticipationPermissionRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .build();

            CreateParticipationPermissionResponse res = service.createParticipationPermission(USER_ID, req);

            assertEquals(Code.PERMISSION_DENIED_VALUE, res.getStatus().getCode());
        }
    }

    // ── participateInFamilyCircle ─────────────────────────────────────────────

    @Nested
    @DisplayName("participateInFamilyCircle Tests")
    class ParticipateInFamilyCircleTests {

        @Test
        @SuppressWarnings("unchecked")
        void should_joinCircle_whenValidOtp() {
            when(redisTemplate.execute(any(RedisScript.class), anyList()))
                    .thenReturn(CIRCLE_ID.toString());
            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.empty());

            ParticipateInFamilyCircleRequest req = ParticipateInFamilyCircleRequest.newBuilder()
                    .setOtp("VALIDOTP12345678")
                    .build();

            ParticipateInFamilyCircleResponse res = service.participateInFamilyCircle(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            verify(familyCircleMemberRepository).save(argThat(m ->
                    !m.isAdmin() && m.getId().getMemberId().equals(USER_ID)));
        }

        @Test
        @SuppressWarnings("unchecked")
        void should_returnNotFound_whenOtpInvalidOrExpired() {
            when(redisTemplate.execute(any(RedisScript.class), anyList())).thenReturn(null);

            ParticipateInFamilyCircleRequest req = ParticipateInFamilyCircleRequest.newBuilder()
                    .setOtp("EXPIREDOTP123456")
                    .build();

            ParticipateInFamilyCircleResponse res = service.participateInFamilyCircle(USER_ID, req);

            assertEquals(Code.NOT_FOUND_VALUE, res.getStatus().getCode());
            verify(familyCircleMemberRepository, never()).save(any());
        }

        @Test
        @SuppressWarnings("unchecked")
        void should_returnAlreadyExists_whenUserAlreadyMember() {
            when(redisTemplate.execute(any(RedisScript.class), anyList()))
                    .thenReturn(CIRCLE_ID.toString());
            FamilyCircleMember existing = buildMember(CIRCLE_ID, USER_ID, false);
            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.of(existing));

            ParticipateInFamilyCircleRequest req = ParticipateInFamilyCircleRequest.newBuilder()
                    .setOtp("VALIDOTP12345678")
                    .build();

            ParticipateInFamilyCircleResponse res = service.participateInFamilyCircle(USER_ID, req);

            assertEquals(Code.ALREADY_EXISTS_VALUE, res.getStatus().getCode());
        }
    }

    // ── leaveFamilyCircle ─────────────────────────────────────────────────────

    @Nested
    @DisplayName("leaveFamilyCircle Tests")
    class LeaveFamilyCircleTests {

        @Test
        void should_leaveCircle_whenNonAdminMember() {
            FamilyCircleMember member = buildMember(CIRCLE_ID, USER_ID, false);
            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.of(member));

            LeaveFamilyCircleRequest req = LeaveFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString()).build();
            LeaveFamilyCircleResponse res = service.leaveFamilyCircle(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            verify(familyCircleMemberRepository).delete(member);
        }

        @Test
        void should_returnNotFound_whenNotMember() {
            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.empty());

            LeaveFamilyCircleRequest req = LeaveFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString()).build();
            LeaveFamilyCircleResponse res = service.leaveFamilyCircle(USER_ID, req);

            assertEquals(Code.NOT_FOUND_VALUE, res.getStatus().getCode());
        }

        @Test
        void should_returnFailedPrecondition_whenAdminTriesToLeave() {
            FamilyCircleMember adminMember = buildMember(CIRCLE_ID, USER_ID, true);
            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.of(adminMember));

            LeaveFamilyCircleRequest req = LeaveFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString()).build();
            LeaveFamilyCircleResponse res = service.leaveFamilyCircle(USER_ID, req);

            assertEquals(Code.FAILED_PRECONDITION_VALUE, res.getStatus().getCode());
            verify(familyCircleMemberRepository, never()).delete(any());
        }
    }

    // ── assignFamilyCircleAdmin ───────────────────────────────────────────────

    @Nested
    @DisplayName("assignFamilyCircleAdmin Tests")
    class AssignFamilyCircleAdminTests {

        @Test
        void should_transferAdmin_whenCallerIsAdmin() {
            FamilyCircleMember admin = buildMember(CIRCLE_ID, USER_ID, true);
            FamilyCircleMember newAdmin = buildMember(CIRCLE_ID, MEMBER_ID, false);
            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.of(admin));
            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, MEMBER_ID))
                    .thenReturn(Optional.of(newAdmin));

            AssignFamilyCircleAdminRequest req = AssignFamilyCircleAdminRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .setMemberId(MEMBER_ID.toString()).build();
            AssignFamilyCircleAdminResponse res = service.assignFamilyCircleAdmin(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            assertFalse(admin.isAdmin());
            assertTrue(newAdmin.isAdmin());
        }

        @Test
        void should_returnPermissionDenied_whenCallerNotAdmin() {
            FamilyCircleMember caller = buildMember(CIRCLE_ID, USER_ID, false);
            FamilyCircleMember target = buildMember(CIRCLE_ID, MEMBER_ID, false);
            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.of(caller));
            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, MEMBER_ID))
                    .thenReturn(Optional.of(target));

            AssignFamilyCircleAdminRequest req = AssignFamilyCircleAdminRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .setMemberId(MEMBER_ID.toString()).build();
            AssignFamilyCircleAdminResponse res = service.assignFamilyCircleAdmin(USER_ID, req);

            assertEquals(Code.PERMISSION_DENIED_VALUE, res.getStatus().getCode());
        }

        @Test
        void should_returnNotFound_whenEitherMemberMissing() {
            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.empty());
            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, MEMBER_ID))
                    .thenReturn(Optional.empty());

            AssignFamilyCircleAdminRequest req = AssignFamilyCircleAdminRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .setMemberId(MEMBER_ID.toString()).build();
            AssignFamilyCircleAdminResponse res = service.assignFamilyCircleAdmin(USER_ID, req);

            assertEquals(Code.NOT_FOUND_VALUE, res.getStatus().getCode());
        }
    }

    // ── removeMemberFromFamilyCircle ──────────────────────────────────────────

    @Nested
    @DisplayName("removeMemberFromFamilyCircle Tests")
    class RemoveMemberFromFamilyCircleTests {

        @Test
        void should_removeMember_whenCallerIsAdmin() {
            FamilyCircleMember admin = buildMember(CIRCLE_ID, USER_ID, true);
            FamilyCircleMember target = buildMember(CIRCLE_ID, MEMBER_ID, false);
            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.of(admin));
            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, MEMBER_ID))
                    .thenReturn(Optional.of(target));

            RemoveMemberFromFamilyCircleRequest req = RemoveMemberFromFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .setMemberId(MEMBER_ID.toString()).build();
            RemoveMemberFromFamilyCircleResponse res = service.removeMemberFromFamilyCircle(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            verify(familyCircleMemberRepository).delete(target);
        }

        @Test
        void should_returnFailedPrecondition_whenRemovingSelf() {
            RemoveMemberFromFamilyCircleRequest req = RemoveMemberFromFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .setMemberId(USER_ID.toString()).build();
            RemoveMemberFromFamilyCircleResponse res = service.removeMemberFromFamilyCircle(USER_ID, req);

            assertEquals(Code.FAILED_PRECONDITION_VALUE, res.getStatus().getCode());
            verify(familyCircleMemberRepository, never()).delete(any());
        }

        @Test
        void should_returnPermissionDenied_whenCallerNotAdmin() {
            FamilyCircleMember nonAdmin = buildMember(CIRCLE_ID, USER_ID, false);
            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.of(nonAdmin));

            RemoveMemberFromFamilyCircleRequest req = RemoveMemberFromFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .setMemberId(MEMBER_ID.toString()).build();
            RemoveMemberFromFamilyCircleResponse res = service.removeMemberFromFamilyCircle(USER_ID, req);

            assertEquals(Code.PERMISSION_DENIED_VALUE, res.getStatus().getCode());
        }

        @Test
        void should_returnNotFound_whenTargetMemberAbsent() {
            FamilyCircleMember admin = buildMember(CIRCLE_ID, USER_ID, true);
            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.of(admin));
            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, MEMBER_ID))
                    .thenReturn(Optional.empty());

            RemoveMemberFromFamilyCircleRequest req = RemoveMemberFromFamilyCircleRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .setMemberId(MEMBER_ID.toString()).build();
            RemoveMemberFromFamilyCircleResponse res = service.removeMemberFromFamilyCircle(USER_ID, req);

            assertEquals(Code.NOT_FOUND_VALUE, res.getStatus().getCode());
        }
    }

    // ── listFamilyCircleMembers ───────────────────────────────────────────────

    @Nested
    @DisplayName("listFamilyCircleMembers Tests")
    class ListFamilyCircleMembersTests {

        @Test
        void should_listMembers_whenUserIsMember() {
            FamilyCircleMember caller = buildMember(CIRCLE_ID, USER_ID, true);
            FamilyCircleMember other = buildMember(CIRCLE_ID, MEMBER_ID, false);

            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.of(caller));
            when(familyCircleMemberRepository.findById_FamilyCircleId(CIRCLE_ID))
                    .thenReturn(List.of(caller, other));

            ListFamilyCircleMembersRequest req = ListFamilyCircleMembersRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString()).build();
            ListFamilyCircleMembersResponse res = service.listFamilyCircleMembers(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            assertEquals(2, res.getMembersCount());
        }

        @Test
        void should_returnPermissionDenied_whenNotMember() {
            when(familyCircleMemberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.empty());

            ListFamilyCircleMembersRequest req = ListFamilyCircleMembersRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString()).build();
            ListFamilyCircleMembersResponse res = service.listFamilyCircleMembers(USER_ID, req);

            assertEquals(Code.PERMISSION_DENIED_VALUE, res.getStatus().getCode());
            verify(familyCircleMemberRepository, never()).findById_FamilyCircleId(any());
        }
    }
}
