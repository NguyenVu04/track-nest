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
        UUID userId = getCurrentUserId();
        observer.sendTargetLocation(userId, message);

        log.info("Tracked location for userId {}: {}", userId, message);

//        observer.sendTargetLocation(userId, message);
    }

    @Override
    public List<LocationResponse> retrieveTargetsLastLocation() {
        return List.of();
    }

    @Override
    public List<LocationResponse> retrieveTargetLocationHistory(UUID targetId) {
        return List.of();
    }
}
