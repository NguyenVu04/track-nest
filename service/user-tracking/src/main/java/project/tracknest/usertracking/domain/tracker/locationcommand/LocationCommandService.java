package project.tracknest.usertracking.domain.tracker.locationcommand;

import project.tracknest.usertracking.proto.lib.UpdateUserLocationRequest;

import java.util.UUID;

public interface LocationCommandService {
    void updateUserLocation(UUID userId, String username, UpdateUserLocationRequest request);
}
