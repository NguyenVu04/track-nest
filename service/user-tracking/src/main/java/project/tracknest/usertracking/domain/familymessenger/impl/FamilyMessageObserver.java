package project.tracknest.usertracking.domain.familymessenger.impl;

import project.tracknest.usertracking.core.datatype.FamilyMessageEvent;

import java.util.UUID;

interface FamilyMessageObserver {
    void deliverToUser(UUID userId, FamilyMessageEvent event);
}
