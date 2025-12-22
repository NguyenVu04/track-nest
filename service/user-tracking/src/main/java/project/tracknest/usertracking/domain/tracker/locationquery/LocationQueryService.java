package project.tracknest.usertracking.domain.tracker.locationquery;

import project.tracknest.usertracking.proto.lib.LocationHistoryRequest;
import project.tracknest.usertracking.proto.lib.LocationResponse;

import java.util.List;
import java.util.UUID;

public interface LocationQueryService {
    List<LocationResponse> retrieveTargetsLastLocations(UUID trackerId);
    List<LocationResponse> retrieveTargetLocationHistory(UUID trackerId, LocationHistoryRequest request);
}
