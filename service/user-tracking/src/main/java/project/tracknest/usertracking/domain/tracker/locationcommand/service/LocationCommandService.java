package project.tracknest.usertracking.domain.tracker.locationcommand.service;

import project.tracknest.usertracking.proto.lib.UpdateUserLocationRequest;
import project.tracknest.usertracking.proto.lib.UpdateUserLocationResponse;

import java.util.UUID;

public interface LocationCommandService {
    UpdateUserLocationResponse updateUserLocation(UUID userId, UpdateUserLocationRequest request);
}
