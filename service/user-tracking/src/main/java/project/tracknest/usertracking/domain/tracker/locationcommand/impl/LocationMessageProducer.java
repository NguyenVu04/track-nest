package project.tracknest.usertracking.domain.tracker.locationcommand.impl;

import project.tracknest.usertracking.core.datatype.LocationMessage;

interface LocationMessageProducer {
    void produce(LocationMessage message);
}
