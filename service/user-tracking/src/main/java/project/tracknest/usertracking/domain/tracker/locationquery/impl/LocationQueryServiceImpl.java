package project.tracknest.usertracking.domain.tracker.locationquery.impl;

import com.google.rpc.Code;
import com.google.rpc.Status;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.usertracking.core.datatype.LocationMessage;
import project.tracknest.usertracking.core.entity.User;
import project.tracknest.usertracking.domain.tracker.locationquery.service.LocationMessageConsumer;
import project.tracknest.usertracking.domain.tracker.locationquery.service.LocationQueryService;
import project.tracknest.usertracking.proto.lib.FamilyMemberLocation;
import project.tracknest.usertracking.proto.lib.ListFamilyMemberLocationHistoryRequest;
import project.tracknest.usertracking.proto.lib.ListFamilyMemberLocationHistoryResponse;
import project.tracknest.usertracking.proto.lib.StreamFamilyMemberLocationsRequest;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
class LocationQueryServiceImpl implements LocationQueryService, LocationMessageConsumer {
    private final LocationObserver observer;
    private final LocationRepository locationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public void trackTaget(LocationMessage message) {
        List<User> familyMembers = userRepository
                .findAllUserFamilyMembers(message.userId());

        familyMembers.forEach(
                (member) ->
                        observer.sendTargetLocation(
                                member.getId(),
                                message
                        )
        );

        log.info("Tracked location for userId {}: {}", message.userId(), message);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FamilyMemberLocation> streamFamilyMemberLocations(
            UUID userId,
            StreamFamilyMemberLocationsRequest request
    ) {
        List<User> members = userRepository.findAllUserFamilyMembers(userId);

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

        Optional<User> memberOpt = userRepository.findById(memberId);
        if (memberOpt.isEmpty()) {
            log.warn("Target user with id {} not found. Cannot retrieve location history.", memberId);
            return ListFamilyMemberLocationHistoryResponse
                    .newBuilder()
                    .setStatus(
                            Status
                                    .newBuilder()
                                    .setCode(Code.INTERNAL_VALUE)
                                    .setMessage("Target user not found")
                                    .build()
                    )
                    .addAllLocations(List.of())
                    .build();
        }
        User member = memberOpt.get();

        List<FamilyMemberLocation> locations = locationRepository.findByUserIdAndWithinRadius(
                        memberId,
                        request.getCenterLongitudeDeg(),
                        request.getCenterLatitudeDeg(),
                        request.getRadiusMeter())
                .stream()
                .map(
                        location ->
                                FamilyMemberLocation
                                        .newBuilder()
                                        .setMemberId(member.getId()
                                                .toString())
                                        .setMemberUsername(member
                                                .getUsername())
                                        .setAccuracyMeter(location.getAccuracy())
                                        .setOnline(location.getUser()
                                                .isConnected())
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
                .addAllLocations(locations)
                .build();
    }

}
