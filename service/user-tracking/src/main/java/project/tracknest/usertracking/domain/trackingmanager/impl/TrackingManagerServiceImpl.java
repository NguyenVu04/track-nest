package project.tracknest.usertracking.domain.trackingmanager.impl;

import com.google.rpc.Code;
import com.google.rpc.Status;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.usertracking.core.datatype.PageToken;
import project.tracknest.usertracking.core.entity.FamilyCircle;
import project.tracknest.usertracking.core.entity.FamilyCircleMember;
import project.tracknest.usertracking.core.entity.User;
import project.tracknest.usertracking.core.utils.OtpGenerator;
import project.tracknest.usertracking.core.utils.PageTokenCodec;
import project.tracknest.usertracking.domain.trackingmanager.service.TrackingManagerService;
import project.tracknest.usertracking.proto.lib.*;

import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static project.tracknest.usertracking.core.utils.OtpGenerator.OTP_TTL_SECONDS;

@Service
@RequiredArgsConstructor
@Slf4j
class TrackingManagerServiceImpl implements TrackingManagerService {
    public static final String PARTICIPATION_PERMISSION_KEY_PREFIX = "family_circle:participation_permission:";

    private static final int DEFAULT_PAGE_SIZE = 32;

    private final StringRedisTemplate redisTemplate;

    private final TrackingManagerFamilyCircleRepository familyCircleRepository;
    private final TrackingManagerFamilyCircleMemberRepository familyCircleMemberRepository;
    private final TrackingManagerUserRepository userRepository;

    @Override
    @Transactional
    public CreateFamilyCircleResponse createFamilyCircle(UUID userId, CreateFamilyCircleRequest request) {
        FamilyCircle circle = FamilyCircle
                .builder()
                .name(request.getName())
                .build();
        FamilyCircle savedCircle = familyCircleRepository.saveAndFlush(circle);

        User user = userRepository
                .findById(userId)
                .orElseThrow(() -> {
                    log.error("User with ID {} not found", userId);
                    return new RuntimeException("User not found");
                });

        FamilyCircleMember member = FamilyCircleMember
                .builder()
                .id(FamilyCircleMember.FamilyCircleMemberId
                        .builder()
                        .familyCircleId(savedCircle.getId())
                        .memberId(user.getId())
                        .build())
                .isAdmin(true)
                .role(request.getFamilyRole())
                .build();

        List<FamilyCircleMember> members = new ArrayList<>();
        members.add(member);
        savedCircle.setMembers(members);

        return CreateFamilyCircleResponse
                .newBuilder()
                .setStatus(Status
                        .newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Family circle created successfully")
                        .build())
                .setFamilyCircleId(savedCircle.getId().toString())
                .setCreatedAtMs(Instant.now().toEpochMilli())
                .build();
    }

    private FamilyCircleInfo toProto(FamilyCircle fc) {
        return FamilyCircleInfo.newBuilder()
                .setFamilyCircleId(fc.getId().toString())
                .setName(fc.getName())
                .setCreatedAtMs(fc.getCreatedAt().toInstant().toEpochMilli())
                .build();
    }

    private PageToken buildNextToken(Slice<FamilyCircle> slice) {
        FamilyCircle last = slice.getContent()
                .get(slice.getNumberOfElements() - 1);

        return new PageToken(
                last.getCreatedAt().toInstant().toEpochMilli(),
                last.getId().toString()
        );
    }


    @Override
    @Transactional(readOnly = true)
    public ListFamilyCircleResponse listFamilyCircles(
            UUID userId,
            ListFamilyCirclesRequest request
    ) {
        PageToken cursor = PageTokenCodec.decode(request.getPageToken());

        int pageSize = request.getPageSize() > 0
                ? request.getPageSize()
                : DEFAULT_PAGE_SIZE;

        Pageable pageable = PageRequest.ofSize(pageSize);

        // 2. Query
        Slice<FamilyCircle> slice = cursor == null
                ? familyCircleRepository.findFirstPageByUserId(userId, pageable)
                : familyCircleRepository.findNextPageByUserId(
                userId,
                Instant.ofEpochMilli(cursor.lastCreatedAtMs())
                        .atOffset(ZoneOffset.UTC), UUID.fromString(cursor.lastId()),
                pageable);


        List<FamilyCircleInfo> infos = slice.getContent().stream()
                .map(this::toProto)
                .toList();

        // 4. Build response
        ListFamilyCircleResponse.Builder response =
                ListFamilyCircleResponse.newBuilder()
                        .addAllFamilyCircles(infos);

        if (slice.hasNext()) {
            response.setNextPageToken(
                    PageTokenCodec.encode(buildNextToken(slice))
            );
        }

        return response.build();
    }

    @Override
    @Transactional
    public DeleteFamilyCircleResponse deleteFamilyCircle(UUID userId, DeleteFamilyCircleRequest request) {
        UUID circleId = UUID.fromString(request.getFamilyCircleId());
        Optional<FamilyCircle> circleOpt = familyCircleRepository
                .findCircleIfAdmin(
                        userId,
                        circleId);

        if (circleOpt.isEmpty()) {
            log.warn("User {} is not an admin of the family circle {}",
                    userId, circleId);

            return DeleteFamilyCircleResponse
                    .newBuilder()
                    .setStatus(Status
                            .newBuilder()
                            .setCode(Code.PERMISSION_DENIED_VALUE)
                            .setMessage("User is not an admin of the family circle or circle does not exist")
                            .build())
                    .build();
        }

        familyCircleRepository.delete(circleOpt.get());
        return DeleteFamilyCircleResponse
                .newBuilder()
                .setStatus(Status
                        .newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Family circle deleted successfully")
                        .build())
                .build();
    }

    @Override
    @Transactional
    public UpdateFamilyCircleResponse updateFamilyCircle(UUID userId, UpdateFamilyCircleRequest request) {
        Optional<FamilyCircle> circleOpt = familyCircleRepository
                .findCircleIfAdmin(
                        userId,
                        UUID.fromString(request.getFamilyCircleId()));

        if (circleOpt.isEmpty()) {
            log.warn("User {} is not an admin of the family circle {} or circle does not exist",
                    userId, request.getFamilyCircleId());

            return UpdateFamilyCircleResponse
                    .newBuilder()
                    .setStatus(Status
                            .newBuilder()
                            .setCode(Code.PERMISSION_DENIED_VALUE)
                            .setMessage("User is not an admin of the family circle or circle does not exist")
                            .build())
                    .build();
        }

        FamilyCircle circle = circleOpt.get();
        circle.setName(request.getName());
        familyCircleRepository.save(circle);
        return UpdateFamilyCircleResponse
                .newBuilder()
                .setStatus(Status
                        .newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Family circle updated successfully")
                        .build())
                .build();
    }

    @Override
    @Transactional
    public UpdateFamilyRoleResponse updateFamilyRole(UUID userId, UpdateFamilyRoleRequest request) {
        Optional<FamilyCircleMember> memberOpt = familyCircleMemberRepository
                .findById_FamilyCircleIdAndId_MemberId(
                        UUID.fromString(request.getFamilyCircleId()),
                        userId);

        if (memberOpt.isEmpty()) {
            return UpdateFamilyRoleResponse
                    .newBuilder()
                    .setStatus(Status
                            .newBuilder()
                            .setCode(Code.NOT_FOUND_VALUE)
                            .setMessage("User is not a member of the family circle")
                            .build())
                    .build();
        }

        FamilyCircleMember member = memberOpt.get();
        member.setRole(request.getFamilyRole());
        familyCircleMemberRepository.save(member);

        return UpdateFamilyRoleResponse
                .newBuilder()
                .setStatus(Status
                        .newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Family role updated successfully")
                        .build())
                .build();
    }

    private String getRedisKeyForParticipationPermission(String otp) {
        return PARTICIPATION_PERMISSION_KEY_PREFIX + otp;
    }

    @Override
    public CreateParticipationPermissionResponse createParticipationPermission(
            UUID userId,
            CreateParticipationPermissionRequest request
    ) {
        Optional<FamilyCircleMember> adminOpt = familyCircleMemberRepository
                .findById_FamilyCircleIdAndId_MemberId(
                        UUID.fromString(request.getFamilyCircleId()),
                        userId);

        if (adminOpt.isEmpty() || !adminOpt.get().isAdmin()) {
            log.warn("User {} is not authorized to create participation permission for family circle {}",
                    userId, request.getFamilyCircleId());
            return CreateParticipationPermissionResponse
                    .newBuilder()
                    .setStatus(Status
                            .newBuilder()
                            .setCode(Code.PERMISSION_DENIED_VALUE)
                            .setMessage("User is not an admin of the family circle")
                            .build())
                    .build();
        }

        if (request.hasPreviousOtp()) {
            String previousRedisKey = getRedisKeyForParticipationPermission(request.getPreviousOtp());
            redisTemplate.delete(previousRedisKey);
        }

        String otp = OtpGenerator.generateOtp();
        String redisKey = getRedisKeyForParticipationPermission(otp);

        OffsetDateTime createdAt = OffsetDateTime.now();
        OffsetDateTime expiredAt = createdAt.plusSeconds(OTP_TTL_SECONDS);

        redisTemplate.opsForValue().set(
                redisKey,
                request.getFamilyCircleId(),
                Duration.ofSeconds(OTP_TTL_SECONDS));

        return CreateParticipationPermissionResponse
                .newBuilder()
                .setStatus(Status
                        .newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Participation permission created successfully")
                        .build())
                .setOtp(otp)
                .setCreatedAtMs(createdAt.toInstant().toEpochMilli())
                .setExpiredAtMs(expiredAt.toInstant().toEpochMilli())
                .build();
    }

    @Override
    @Transactional
    public ParticipateInFamilyCircleResponse participateInFamilyCircle(UUID userId, ParticipateInFamilyCircleRequest request) {
        String redisKey = getRedisKeyForParticipationPermission(request.getOtp());
        // OTP value is family circle ID
        String otpValue = redisTemplate.opsForValue().get(redisKey);

        if (otpValue == null) {
            log.warn("Invalid or expired OTP {} used by user {}", request.getOtp(), userId);
            return ParticipateInFamilyCircleResponse
                    .newBuilder()
                    .setStatus(Status
                            .newBuilder()
                            .setCode(Code.NOT_FOUND_VALUE)
                            .setMessage("Invalid or expired OTP")
                            .build())
                    .build();
        }

        UUID circleId = UUID.fromString(otpValue);

        Optional<FamilyCircleMember> memberOpt = familyCircleMemberRepository
                .findById_FamilyCircleIdAndId_MemberId(
                        circleId,
                        userId);

        if (memberOpt.isPresent()) {
            log.warn("User {} is already a member of the family circle {}",
                    userId, circleId);
            return ParticipateInFamilyCircleResponse
                    .newBuilder()
                    .setStatus(Status
                            .newBuilder()
                            .setCode(Code.ALREADY_EXISTS_VALUE)
                            .setMessage("User is already a member of the family circle")
                            .build())
                    .build();
        }

        FamilyCircleMember member = FamilyCircleMember
                .builder()
                .id(FamilyCircleMember.FamilyCircleMemberId
                        .builder()
                        .familyCircleId(circleId)
                        .memberId(userId)
                        .build())
                .isAdmin(false)
                .build();

        familyCircleMemberRepository.save(member);
        return ParticipateInFamilyCircleResponse
                .newBuilder()
                .setStatus(Status
                        .newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Joined family circle successfully")
                        .build())
                .setParticipatedAtMs(Instant.now().toEpochMilli())
                .build();
    }

    @Override
    @Transactional
    public LeaveFamilyCircleResponse leaveFamilyCircle(UUID userId, LeaveFamilyCircleRequest request) {
        Optional<FamilyCircleMember> memberOpt = familyCircleMemberRepository
                .findById_FamilyCircleIdAndId_MemberId(
                        UUID.fromString(request.getFamilyCircleId()),
                        userId);

        if (memberOpt.isEmpty()) {
            log.warn("User {} is not a member of the family circle {}",
                    userId, request.getFamilyCircleId());
            return LeaveFamilyCircleResponse
                    .newBuilder()
                    .setStatus(Status
                            .newBuilder()
                            .setCode(Code.NOT_FOUND_VALUE)
                            .setMessage("User is not a member of the family circle")
                            .build())
                    .setLeftAtMs(Instant.now().toEpochMilli())
                    .build();
        }

        if (memberOpt.get().isAdmin()) {
            log.warn("Admin user {} cannot leave the family circle {} without assigning a new admin",
                    userId, request.getFamilyCircleId());
            return LeaveFamilyCircleResponse
                    .newBuilder()
                    .setStatus(Status
                            .newBuilder()
                            .setCode(Code.FAILED_PRECONDITION_VALUE)
                            .setMessage("Admin cannot leave the family circle without assigning a new admin")
                            .build())
                    .build();
        }

        familyCircleMemberRepository.delete(memberOpt.get());
        return LeaveFamilyCircleResponse
                .newBuilder()
                .setStatus(Status
                        .newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Left family circle successfully")
                        .build())
                .build();
    }

    @Override
    @Transactional
    public AssignFamilyCircleAdminResponse assignFamilyCircleAdmin(UUID userId, AssignFamilyCircleAdminRequest request) {

        UUID circleId = UUID.fromString(request.getFamilyCircleId());

        Optional<FamilyCircleMember> adminOpt = familyCircleMemberRepository
                .findById_FamilyCircleIdAndId_MemberId(
                        circleId,
                        userId);

        Optional<FamilyCircleMember> memberOpt = familyCircleMemberRepository
                .findById_FamilyCircleIdAndId_MemberId(
                        circleId,
                        UUID.fromString(request.getMemberId()));

        if (adminOpt.isEmpty() || memberOpt.isEmpty()) {
            log.warn("Either admin user {} or member user {} is not a member of the family circle {}",
                    userId, request.getMemberId(), request.getFamilyCircleId());
            return AssignFamilyCircleAdminResponse
                    .newBuilder()
                    .setStatus(Status
                            .newBuilder()
                            .setCode(Code.NOT_FOUND_VALUE)
                            .setMessage("Either admin or member is not a member of the family circle")
                            .build())
                    .build();
        }

        FamilyCircleMember admin = adminOpt.get();
        FamilyCircleMember member = memberOpt.get();

        if (!admin.isAdmin()) {
            log.warn("User {} is not authorized to assign admin role in family circle {}",
                    userId, request.getFamilyCircleId());
            return AssignFamilyCircleAdminResponse
                    .newBuilder()
                    .setStatus(Status
                            .newBuilder()
                            .setCode(Code.PERMISSION_DENIED_VALUE)
                            .setMessage("User is not an admin of the family circle")
                            .build())
                    .build();
        }

        admin.setAdmin(false);
        member.setAdmin(true);

        familyCircleMemberRepository.save(admin);
        familyCircleMemberRepository.save(member);

        return AssignFamilyCircleAdminResponse
                .newBuilder()
                .setStatus(Status
                        .newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Admin role assigned successfully")
                        .build())
                .setAssignedAtMs(Instant.now().toEpochMilli())
                .setMemberId(member
                        .getId()
                        .getMemberId()
                        .toString())
                .build();
    }

    @Override
    @Transactional
    public RemoveMemberFromFamilyCircleResponse removeMemberFromFamilyCircle(UUID userId, RemoveMemberFromFamilyCircleRequest request) {
        UUID circleId = UUID.fromString(request.getFamilyCircleId());

        if (userId.toString().equals(request.getMemberId())) {
            log.warn("User {} cannot remove themselves from family circle {}",
                    userId, request.getFamilyCircleId());
            return RemoveMemberFromFamilyCircleResponse
                    .newBuilder()
                    .setStatus(Status
                            .newBuilder()
                            .setCode(Code.FAILED_PRECONDITION_VALUE)
                            .setMessage("User cannot remove themselves from the family circle")
                            .build())
                    .build();
        }

        Optional<FamilyCircleMember> adminOpt = familyCircleMemberRepository
                .findById_FamilyCircleIdAndId_MemberId(
                        circleId,
                        userId);

        if (adminOpt.isEmpty() || !adminOpt.get().isAdmin()) {
            log.warn("User {} is not authorized to remove members from family circle {}",
                    userId, request.getFamilyCircleId());
            return RemoveMemberFromFamilyCircleResponse
                    .newBuilder()
                    .setStatus(Status
                            .newBuilder()
                            .setCode(Code.PERMISSION_DENIED_VALUE)
                            .setMessage("User is not an admin of the family circle")
                            .build())
                    .build();
        }

        Optional<FamilyCircleMember> memberOpt = familyCircleMemberRepository
                .findById_FamilyCircleIdAndId_MemberId(
                        circleId,
                        UUID.fromString(request.getMemberId()));

        if (memberOpt.isEmpty()) {
            log.warn("Member {} is not found in family circle {}",
                    request.getMemberId(), request.getFamilyCircleId());
            return RemoveMemberFromFamilyCircleResponse
                    .newBuilder()
                    .setStatus(Status
                            .newBuilder()
                            .setCode(Code.NOT_FOUND_VALUE)
                            .setMessage("Member is not found in the family circle")
                            .build())
                    .build();
        }

        familyCircleMemberRepository.delete(memberOpt.get());

        return RemoveMemberFromFamilyCircleResponse
                .newBuilder()
                .setStatus(Status
                        .newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Member removed successfully")
                        .build())
                .setRemovedAtMs(Instant.now().toEpochMilli())
                .setMemberId(request.getMemberId())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ListFamilyCircleMembersResponse listFamilyCircleMembers(UUID userId, ListFamilyCircleMembersRequest request) {
        UUID circleId = UUID.fromString(request.getFamilyCircleId());

        Optional<FamilyCircleMember> memberOpt = familyCircleMemberRepository
                .findById_FamilyCircleIdAndId_MemberId(
                        circleId,
                        userId);

        if (memberOpt.isEmpty()) {
            log.warn("User {} is not a member of the family circle {} when listing members",
                    userId, request.getFamilyCircleId());
            return ListFamilyCircleMembersResponse
                    .newBuilder()
                    .setStatus(Status
                            .newBuilder()
                            .setCode(Code.PERMISSION_DENIED_VALUE)
                            .setMessage("User is not a member of the family circle")
                            .build())
                    .build();
        }

        List<FamilyCircleMember> members = familyCircleMemberRepository
                .findById_FamilyCircleId(circleId);

        List<FamilyCircleMemberInfo> memberInfos = members.stream()
                .map(m -> FamilyCircleMemberInfo.newBuilder()
                        .setMemberId(m.getId()
                                .getMemberId()
                                .toString())
                        .setIsAdmin(m.isAdmin())
                        .setFamilyRole(m.getRole())
                        .setMemberUsername(m.getMember()
                                .getUsername())
                        .setMemberAvatarUrl(m.getMember()
                                .getAvatarUrl() == null
                                ? ""
                                : m.getMember().getAvatarUrl())
                        .setLastActiveMs(m.getMember()
                                .getLastActive()
                                .toInstant()
                                .toEpochMilli())
                        .setOnline(m.getMember()
                                .isConnected())
                        .build())
                .toList();

        return ListFamilyCircleMembersResponse
                .newBuilder()
                .setStatus(Status
                        .newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Family circle members listed successfully")
                        .build())
                .addAllMembers(memberInfos)
                .build();
    }
}
