package project.tracknest.usertracking.domain.tracker.locationcommand;

import project.tracknest.usertracking.core.datatype.LocationMessage;

public interface LocationMessageProducer {
    void produce(LocationMessage message);
}
