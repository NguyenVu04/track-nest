package project.tracknest.usertracking.domain.tracker.locationquery.service;

import project.tracknest.usertracking.core.datatype.LocationMessage;

import java.util.UUID;

public interface LocationQuerySubscriber {
    void receiveLocationMessage(UUID receiverId, LocationMessage message);
}
