package project.tracknest.usertracking.domain.tracker.locationcommand.service;

import project.tracknest.usertracking.proto.lib.UpdateUserLocationRequest;

import java.util.UUID;

public interface LocationCommandService {
    void updateUserLocation(UUID userId, UpdateUserLocationRequest request);
}
