package project.tracknest.usertracking.domain.familymessenger.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import project.tracknest.usertracking.core.datatype.FamilyMessageEvent;
import project.tracknest.usertracking.domain.familymessenger.service.FamilyMessengerEventSubscriber;

import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
class FamilyMessengerEventSubscriberImpl implements FamilyMessengerEventSubscriber {
    private final FamilyMessageObserver observer;

    @Override
    public void receiveFamilyMessageEvent(UUID receiverId, FamilyMessageEvent event) {
        try {
            observer.deliverToUser(receiverId, event);
        } catch (Exception e) {
            log.error("Failed to deliver family message event to user {}: {}", receiverId, e.getMessage(), e);
        }
    }
}
