package project.tracknest.usertracking.domain.tracker.locationquery;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.usertracking.core.datatype.LocationMessage;
import project.tracknest.usertracking.core.entity.User;
import project.tracknest.usertracking.proto.lib.LocationResponse;

import java.util.List;
import java.util.Optional;
import java.util.Set;
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

        Set<User> trackers = userOpt.get().getTrackers();

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

        Set<User> targets = trackerOpt.get().getTargets();
        //TODO: how to get username here?
        return locationRepository.findLatestByUserIdIn(
                targets.stream().map(User::getId)
                        .collect(Collectors.toSet())
        ).stream().map(location -> LocationResponse.newBuilder()
                .setUserId(location.getId().getUserId().toString())
                .setAccuracy(location.getAccuracy())
                .setConnected(location.getUser().isOnline())
                .setVelocity(location.getVelocity())
                .setLatitude(location.getLatitude())
                .setLongitude(location.getLongitude())
                .setTimestamp(location.getId().getTimestamp().toEpochSecond())
                .build()).toList();
    }

    @Override
    public List<LocationResponse> retrieveTargetLocationHistory(UUID targetId) {
        //TODO: implement retrieval of location history for the specified targetId if the current user is allowed to track it
        return List.of();
    }
}
