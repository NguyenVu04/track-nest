package project.tracknest.emergencyops.domain.notificationoutbox.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.emergencyops.core.entity.PendingNotification;
import project.tracknest.emergencyops.domain.notificationoutbox.service.NotificationOutboxService;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
class NotificationOutboxServiceImpl implements NotificationOutboxService {

    private final SimpMessagingTemplate messagingTemplate;
    private final SimpUserRegistry simpUserRegistry;
    private final PendingNotificationRepository repository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void sendToUser(UUID userId, String destination, Object payload) {
        boolean online = simpUserRegistry.getUser(userId.toString()) != null;

        if (online) {
            messagingTemplate.convertAndSendToUser(userId.toString(), destination, payload);
            return;
        }

        // User is offline locally — persist for replay on next connect.
        // Cross-pod routing happens before this call (see Redis fan-out in
        // *Subscriber classes), so an empty local registry truly means offline.
        try {
            PendingNotification row = PendingNotification.builder()
                    .userId(userId)
                    .destination(destination)
                    .payloadJson(objectMapper.writeValueAsString(payload))
                    .build();
            repository.save(row);
            log.debug("[outbox] queued PENDING for user={} dest={}", userId, destination);
        } catch (JsonProcessingException e) {
            log.error("[outbox] failed to serialise payload for user={} dest={}", userId, destination, e);
        }
    }

    @Override
    @Transactional
    public void flushFor(UUID userId, String destination) {
        List<PendingNotification> pending = repository
                .findByUserIdAndDestinationAndDeliveredAtIsNullOrderByCreatedAtAsc(userId, destination);

        if (pending.isEmpty()) {
            return;
        }

        log.info("[outbox] flushing {} pending notification(s) for user={} dest={}",
                pending.size(), userId, destination);

        OffsetDateTime now = OffsetDateTime.now();
        for (PendingNotification row : pending) {
            try {
                JsonNode body = objectMapper.readTree(row.getPayloadJson());
                messagingTemplate.convertAndSendToUser(
                        userId.toString(),
                        row.getDestination(),
                        body);
                row.setDeliveredAt(now);
            } catch (Exception e) {
                log.error("[outbox] failed to replay pending id={} for user={}", row.getId(), userId, e);
                // Leave delivered_at null so a later flush retries.
            }
        }
        repository.saveAll(pending);
    }
}
