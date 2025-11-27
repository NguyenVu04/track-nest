package project.tracknest.usertracking.domain.tracker.locationcommand;

import project.tracknest.usertracking.proto.lib.LocationRequest;

import java.util.UUID;

public interface LocationCommandService {
    void updateLocation(UUID userId, LocationRequest request);
}
