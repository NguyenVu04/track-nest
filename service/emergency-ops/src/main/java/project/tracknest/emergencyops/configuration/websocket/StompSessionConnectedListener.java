package project.tracknest.emergencyops.configuration.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import project.tracknest.emergencyops.domain.notificationoutbox.service.NotificationOutboxService;

import java.security.Principal;
import java.util.UUID;

/**
 * Triggers outbox flush when a user (re)subscribes to a /user/* destination —
 * NOT on SessionConnectedEvent.
 *
 * <p>Reason: SessionConnectedEvent fires synchronously when the server sends
 * the CONNECTED frame. The client only sends SUBSCRIBE frames after RECEIVING
 * that CONNECTED frame (one network round-trip later). Any message
 * convertAndSendToUser pushes during that window has no subscriber registered
 * yet, and Spring's SimpleBroker drops it silently. Hooking SessionSubscribeEvent
 * guarantees the broker has a route for the messages we replay.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StompSessionConnectedListener {

    private static final String USER_DEST_PREFIX = "/user";

    private final NotificationOutboxService outbox;

    @EventListener
    public void onSessionSubscribe(SessionSubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal user = accessor.getUser();
        if (user == null) {
            // Handshake interceptor should have rejected this — log defensively.
            log.debug("[ws] subscribe event without principal");
            return;
        }

        String destination = accessor.getDestination();
        if (destination == null || !destination.startsWith(USER_DEST_PREFIX + "/")) {
            // Outbox only tracks /user/* destinations. Topics (/topic/...) and
            // any app destinations have no per-user buffering.
            return;
        }

        UUID userId;
        try {
            userId = UUID.fromString(user.getName());
        } catch (IllegalArgumentException e) {
            log.warn("[ws] principal name is not a UUID: {}", user.getName());
            return;
        }

        // Frontend subscribes to "/user/queue/emergency-request" but outbox
        // stores the destination as "/queue/emergency-request" (what was passed
        // to convertAndSendToUser). Strip the /user prefix to match.
        String storedDestination = destination.substring(USER_DEST_PREFIX.length());

        try {
            outbox.flushFor(userId, storedDestination);
        } catch (Exception e) {
            log.error("[ws] outbox flush failed for user={} dest={}", userId, storedDestination, e);
        }
    }
}
