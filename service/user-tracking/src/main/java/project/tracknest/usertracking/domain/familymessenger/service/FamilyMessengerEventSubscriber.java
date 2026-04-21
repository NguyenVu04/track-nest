package project.tracknest.usertracking.domain.familymessenger.service;

import project.tracknest.usertracking.core.datatype.FamilyMessageEvent;

import java.util.UUID;

public interface FamilyMessengerEventSubscriber {
    void receiveFamilyMessageEvent(UUID receiverId, FamilyMessageEvent event);
}
