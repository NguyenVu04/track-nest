package project.tracknest.emergencyops.domain.notificationoutbox.service;

import java.util.UUID;

/**
 * Wraps STOMP user-queue sends with a persistent outbox so messages survive
 * offline recipients. {@link #sendToUser} attempts immediate delivery; if the
 * user has no active session, the payload is stored and {@link #flushFor}
 * replays it on (re)connect.
 */
public interface NotificationOutboxService {

    /**
     * Send a payload to a user queue. If the user is currently connected via
     * STOMP, the message is delivered immediately. Otherwise it is persisted
     * and delivered the next time {@link #flushFor} is called for that user.
     */
    void sendToUser(UUID userId, String destination, Object payload);

    /**
     * Replay every PENDING notification for the given user on the given
     * destination, mark them as delivered.
     *
     * <p>Triggered per SUBSCRIBE frame (not per CONNECT) because messages
     * pushed before the client's SUBSCRIBE arrives are dropped by SimpleBroker.
     * Filtering by destination ensures the subscription that just registered
     * matches the queue the pending payload was originally addressed to.
     */
    void flushFor(UUID userId, String destination);
}
