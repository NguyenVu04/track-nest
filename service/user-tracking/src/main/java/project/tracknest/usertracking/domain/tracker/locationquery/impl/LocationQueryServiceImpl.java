package project.tracknest.usertracking.domain.tracker.locationquery.impl;

import com.google.rpc.Code;
import com.google.rpc.Status;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.usertracking.configuration.redis.ServerRedisMessage;
import project.tracknest.usertracking.configuration.redis.ServerRedisMessagePublisher;
import project.tracknest.usertracking.core.datatype.LocationMessage;
import project.tracknest.usertracking.core.entity.Location;
import project.tracknest.usertracking.core.entity.User;
import project.tracknest.usertracking.domain.tracker.locationquery.service.LocationQueryService;
import project.tracknest.usertracking.domain.tracker.locationquery.service.LocationQuerySubscriber;
import project.tracknest.usertracking.proto.lib.FamilyMemberLocation;
import project.tracknest.usertracking.proto.lib.ListFamilyMemberLocationHistoryRequest;
import project.tracknest.usertracking.proto.lib.ListFamilyMemberLocationHistoryResponse;
import project.tracknest.usertracking.proto.lib.StreamFamilyMemberLocationsRequest;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
class LocationQueryServiceImpl implements LocationQueryService, LocationMessageConsumer, LocationQuerySubscriber {
    private final LocationObserver observer;
    private final LocationQueryLocationRepository locationRepository;
    private final LocationQueryUserRepository userRepository;
    private final ServerRedisMessagePublisher redisPublisher;

    @Override
    @Transactional(readOnly = true)
    public void trackTaget(LocationMessage message) {
        List<User> familyMembers = userRepository
                .findAllUserFamilyMembers(message.userId());

        familyMembers.forEach(
                (member) -> {
                    ServerRedisMessage redisMessage = ServerRedisMessage
                            .builder()
                            .payload(message)
                            .method("receiveLocationMessage")
                            .receiverId(member.getId())
                            .build();

                    redisPublisher.publishMessage(
                            redisMessage,
                            redisMessage.getReceiverId()
                    );
                }
        );

        log.info("Tracked location for userId {}: {}", message.userId(), message);
    }

    @Override
    public void receiveLocationMessage(UUID receiverId, LocationMessage message) {
        try {
            observer.sendTargetLocation(
                    receiverId,
                    message
            );
        } catch (Exception e) {
            log.error("Failed to process location message for receiverId {}: {}",
                    receiverId, e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<FamilyMemberLocation> streamFamilyMemberLocations(
            UUID userId,
            StreamFamilyMemberLocationsRequest request
    ) {
        UUID circleId = UUID.fromString(request.getFamilyCircleId());

        List<User> members = userRepository.findAllUserFamilyMembersInCircle(userId, circleId);

        if (!userRepository.isCircleMember(userId, circleId)) {
            log.warn("User with id {} is not a member of family circle with id {}. Cannot stream locations.",
                    userId, circleId);
            throw new IllegalArgumentException("User is not a member of the specified family circle");
        }

        return locationRepository.findLatestByUserIdIn(
                        members
                                .stream()
                                .map(User::getId)
                                .collect(Collectors.toSet()))
                .stream()
                .map(
                        location ->
                                FamilyMemberLocation
                                        .newBuilder()
                                        .setMemberId(location
                                                .getId()
                                                .getUserId()
                                                .toString())
                                        .setAccuracyMeter(location
                                                .getAccuracy())
                                        .setOnline(location
                                                .getUser()
                                                .isConnected())
                                        .setMemberUsername(location
                                                .getUser()
                                                .getUsername())
                                        .setMemberAvatarUrl(location
                                                .getUser().getAvatarUrl() == null
                                                ? ""
                                                : location.getUser().getAvatarUrl())
                                        .setVelocityMps(location
                                                .getVelocity())
                                        .setLatitudeDeg(location
                                                .getLatitude())
                                        .setLongitudeDeg(location
                                                .getLongitude())
                                        .setTimestampMs(location
                                                .getId()
                                                .getTimestamp()
                                                .toInstant()
                                                .toEpochMilli())
                                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ListFamilyMemberLocationHistoryResponse listFamilyMemberLocationHistory(
            UUID userId,
            ListFamilyMemberLocationHistoryRequest request
    ) {
        UUID memberId = UUID.fromString(request.getMemberId());

        if (!userRepository.isFamilyMember(userId, memberId)) {
            log.warn("User with id {} is not a family member of user with id {}. Cannot retrieve location history.",
                    userId, memberId);
            return ListFamilyMemberLocationHistoryResponse
                    .newBuilder()
                    .setStatus(
                            Status
                                    .newBuilder()
                                    .setCode(Code.PERMISSION_DENIED_VALUE)
                                    .setMessage("User is not a family member")
                                    .build()
                    )
                    .addAllLocations(List.of())
                    .build();
        }

        User member = userRepository.findById(memberId)
                .orElseThrow(() -> {
                    log.error("Family member with ID {} not found", memberId);
                    return new RuntimeException("Family member not found");
                });

        List<Location> locations;

        if (
                !request.hasCenterLatitudeDeg()
                        || !request.hasCenterLongitudeDeg()
                        || !request.hasRadiusMeter()
        ) {
            locations = locationRepository.findByUserId(memberId);
        } else {
            locations = locationRepository.findByUserIdAndWithinRadius(
                    memberId,
                    request.getCenterLongitudeDeg(),
                    request.getCenterLatitudeDeg(),
                    request.getRadiusMeter());
        }

        List<FamilyMemberLocation> memberLocations = locations
                .stream()
                .map(location ->
                        FamilyMemberLocation
                                .newBuilder()
                                .setMemberId(member.getId()
                                        .toString())
                                .setMemberUsername(member
                                        .getUsername())
                                .setMemberAvatarUrl(
                                        member.getAvatarUrl() == null
                                                ? ""
                                                : member.getAvatarUrl())
                                .setAccuracyMeter(location.getAccuracy())
                                .setOnline(member.isConnected())
                                .setVelocityMps(location.getVelocity())
                                .setLatitudeDeg(location.getLatitude())
                                .setLongitudeDeg(location.getLongitude())
                                .setTimestampMs(location.getId()
                                        .getTimestamp()
                                        .toInstant()
                                        .toEpochMilli())
                                .build())
                .toList();

        return ListFamilyMemberLocationHistoryResponse
                .newBuilder()
                .setStatus(
                        Status
                                .newBuilder()
                                .setCode(Code.OK_VALUE)
                                .setMessage("Location history retrieved successfully")
                                .build()
                )
                .addAllLocations(memberLocations)
                .build();
    }
}
