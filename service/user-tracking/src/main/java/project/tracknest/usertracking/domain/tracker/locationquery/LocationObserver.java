package project.tracknest.usertracking.domain.tracker.locationquery;

import project.tracknest.usertracking.core.datatype.LocationMessage;

import java.util.UUID;

interface LocationObserver {
    void sendTargetLocation(UUID userId, LocationMessage message);
}
