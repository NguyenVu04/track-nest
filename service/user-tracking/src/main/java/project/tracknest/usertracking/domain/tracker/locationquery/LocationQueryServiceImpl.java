package project.tracknest.usertracking.domain.tracker.locationquery;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import project.tracknest.usertracking.core.datatype.LocationMessage;
import project.tracknest.usertracking.proto.lib.LocationResponse;

import java.util.List;
import java.util.UUID;

import static project.tracknest.usertracking.configuration.security.SecurityUtils.getCurrentUserId;

@Slf4j
@Service
@RequiredArgsConstructor
class LocationQueryServiceImpl implements LocationQueryService, LocationMessageConsumer {
    private final LocationObserver observer;
    private final LocationQueryRepository repository;

    @Override
    public void trackTaget(LocationMessage message) {
        //TODO: validate if the current user has permission to track the target user!!!
        observer.sendTargetLocation(message.userId(), message);

        log.info("Tracked location for userId {}: {}", message.userId(), message);
    }

    @Override
    public List<LocationResponse> retrieveTargetsLastLocation() {
        //TODO: implement retrieval of last known locations for all targets the current user is allowed to track
        return List.of();
    }

    @Override
    public List<LocationResponse> retrieveTargetLocationHistory(UUID targetId) {
        //TODO: implement retrieval of location history for the specified targetId if the current user is allowed to track it
        return List.of();
    }
}
