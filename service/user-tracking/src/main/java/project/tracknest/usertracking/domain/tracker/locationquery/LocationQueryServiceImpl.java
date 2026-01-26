package project.tracknest.usertracking.domain.tracker.locationquery;

import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.usertracking.core.datatype.LocationMessage;
import project.tracknest.usertracking.core.entity.User;
import project.tracknest.usertracking.proto.lib.FamilyMemberLocation;
import project.tracknest.usertracking.proto.lib.ListFamilyMemberLocationHistoryRequest;
import project.tracknest.usertracking.proto.lib.ListFamilyMemberLocationHistoryResponse;
import project.tracknest.usertracking.proto.lib.LocationHistoryRequest;
import project.tracknest.usertracking.proto.lib.LocationResponse;
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
    private final LocationQueryRepository locationRepository;
    private final LocationQueryUserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public void trackTaget(LocationMessage message) {
        Optional<User> userOpt = userRepository.findById(message.userId());

        if (userOpt.isEmpty()) {
            log.warn("User with id {} not found. Cannot track location.", message.userId());
            return;
        }

        List<User> trackers = userOpt.get().getTrackers();

        trackers.forEach((tracker) -> observer.sendTargetLocation(tracker.getId(), message));

        log.info("Tracked location for userId {}: {}", message.userId(), message);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LocationResponse> retrieveTargetsLastLocations(UUID trackerId) {
        Optional<User> trackerOpt = userRepository.findById(trackerId);

        if (trackerOpt.isEmpty()) {
            log.warn("Tracker with id {} not found. Cannot retrieve target locations.", trackerId);
            return List.of();
        }

        List<User> targets = trackerOpt.get().getTargets();

        return locationRepository.findLatestByUserIdIn(
                targets.stream().map(User::getId)
                        .collect(Collectors.toSet())
        ).stream().map(location -> LocationResponse.newBuilder()
                .setUserId(location.getId().getUserId().toString())
                .setAccuracy(location.getAccuracy())
                .setConnected(location.getUser().isConnected())
                .setUsername(location.getUser().getUsername())
                .setVelocity(location.getVelocity())
                .setLatitude(location.getLatitude())
                .setLongitude(location.getLongitude())
                .setTimestamp(location.getId()
                        .getTimestamp()
                        .toEpochSecond())
                .build()).toList();
    }

    @Override
    public ListFamilyMemberLocationHistoryResponse listFamilyMemberLocationHistory(
            UUID userId,
            ListFamilyMemberLocationHistoryRequest request
    ) {
        UUID targetId = UUID.fromString(request.getMemberId());

        if (!userRepository.existsTrackingConnection(trackerId, targetId)) {
            log.warn("No tracking connection between tracker {} and target {}. Cannot retrieve location history.",
                    trackerId, targetId);
            return List.of();
        }

        Optional<User> targetOpt = userRepository.findById(targetId);
        if (targetOpt.isEmpty()) {
            log.warn("Target user with id {} not found. Cannot retrieve location history.", targetId);
            return List.of();
        }
        User target = targetOpt.get();

        return locationRepository.findByUserIdAndWithinRadius(
                targetId,
                request.getLongitude(),
                request.getLatitude(),
                request.getRadius()
        ).stream().map(location -> LocationResponse
                .newBuilder()
                        .setUserId(target.getId().toString())
                        .setUsername(target.getUsername())
                        .setAccuracy(location.getAccuracy())
                        .setConnected(location.getUser()
                                .isConnected())
                        .setUsername(location.getUser()
                                .getUsername())
                        .setVelocity(location.getVelocity())
                        .setLatitude(location.getLatitude())
                        .setLongitude(location.getLongitude())
                        .setTimestamp(location.getId()
                                .getTimestamp()
                                .toEpochSecond())
                        .build())
                .toList();
    }

    @Override
    public void streamFamilyMemberLocations(StreamFamilyMemberLocationsRequest request, StreamObserver<FamilyMemberLocation> responseObserver) {

    }

    @Override
    public void listFamilyMemberLocationHistory(ListFamilyMemberLocationHistoryRequest request, StreamObserver<ListFamilyMemberLocationHistoryResponse> responseObserver) {

    }
}
