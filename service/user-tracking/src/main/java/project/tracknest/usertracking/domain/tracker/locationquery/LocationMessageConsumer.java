package project.tracknest.usertracking.domain.tracker.locationquery;

import project.tracknest.usertracking.core.LocationMessage;

public interface LocationMessageConsumer {
    void trackTaget(LocationMessage message);
}
