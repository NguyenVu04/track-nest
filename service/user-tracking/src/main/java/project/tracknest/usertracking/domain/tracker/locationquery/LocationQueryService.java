package project.tracknest.usertracking.domain.tracker.locationquery;

import project.tracknest.usertracking.proto.lib.LocationResponse;

import java.util.List;
import java.util.UUID;

public interface LocationQueryService {
    List<LocationResponse> retrieveTargetsLastLocation();
    List<LocationResponse> retrieveTargetLocationHistory(UUID targetId);
}
