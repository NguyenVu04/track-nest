package project.tracknest.usertracking.domain.tracker.locationcommand;

import project.tracknest.usertracking.proto.lib.LocationRequest;

public interface LocationCommandService {
    void updateLocation(LocationRequest request);
}
