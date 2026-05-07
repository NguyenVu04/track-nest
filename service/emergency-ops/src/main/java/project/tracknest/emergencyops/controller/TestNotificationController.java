package project.tracknest.emergencyops.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.tracknest.emergencyops.core.datatype.TrackingNotificationMessage;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype.AssignedEmergencyRequestMessage;

import java.util.UUID;

/**
 * Test-only endpoints for verifying the two notification channels that fire
 * when an emergency request is created:
 *
 *  1. WebSocket (STOMP) push  → emergency-service dashboard
 *  2. Kafka tracking-notification → user-tracking → FCM push to target user
 */
@RestController
@RequestMapping("/test/notifications")
@RequiredArgsConstructor
@Slf4j
public class TestNotificationController {

    private final SimpMessagingTemplate messagingTemplate;
    private final KafkaTemplate<String, TrackingNotificationMessage> kafkaTemplate;

    @Value("${app.stomp.queue.emergency-request}")
    private String emergencyRequestQueue;

    @Value("${app.kafka.topics[1]}")
    private String trackingNotificationTopic;

    // ── Request / Response ────────────────────────────────────────────────

    public record EmergencyRequestNotificationRequest(
            UUID serviceId,
            UUID requestId,
            UUID targetId,
            String targetUsername,
            String serviceUsername
    ) {}

    public record EmergencyRequestNotificationResponse(
            UUID requestId,
            long timestampMs,
            String websocketDestination,
            String kafkaTopic
    ) {}

    // ── Endpoint ──────────────────────────────────────────────────────────

    /**
     * Simulates the two notifications that fire when an emergency request is
     * created, without touching the DB or requiring a real request to exist.
     *
     * <p>WebSocket message goes to
     * {@code /user/{serviceId}/queue/emergency-request}; Kafka message goes to
     * the {@code tracking-notification} topic so user-tracking can forward an
     * FCM push to the target user's device.
     *
     * @param request serviceId  – STOMP principal of the target emergency service<br>
     *                requestId  – UUID to embed in the notification payload<br>
     *                targetId   – UUID of the user who needs help (Kafka payload)<br>
     *                targetUsername  – display name used in the notification body<br>
     *                serviceUsername – display name of the responding service
     */
    @PostMapping("/emergency-request")
    public ResponseEntity<EmergencyRequestNotificationResponse> testEmergencyRequestNotification(
            @RequestBody EmergencyRequestNotificationRequest request) {

        long now = System.currentTimeMillis();

        // 1. WebSocket push to the emergency-service dashboard
        AssignedEmergencyRequestMessage wsMessage =
                new AssignedEmergencyRequestMessage(request.requestId(), now);
        messagingTemplate.convertAndSendToUser(
                request.serviceId().toString(),
                emergencyRequestQueue,
                wsMessage);
        log.info("[TEST] WebSocket push → user/{}/queue/emergency-request, requestId={}",
                request.serviceId(), request.requestId());

        // 2. Kafka message → user-tracking → FCM push to target user
        TrackingNotificationMessage kafkaMessage = TrackingNotificationMessage.builder()
                .targetId(request.targetId())
                .title("Emergency Assistance Dispatched")
                .content(String.format(
                        "Emergency assistance for %s has been assigned to %s.",
                        request.targetUsername(), request.serviceUsername()))
                .type("EMERGENCY_REQUEST_ASSIGNED")
                .build();
        kafkaTemplate.send(trackingNotificationTopic, kafkaMessage);
        log.info("[TEST] Kafka message → {}, targetId={}", trackingNotificationTopic, request.targetId());

        return ResponseEntity.ok(new EmergencyRequestNotificationResponse(
                request.requestId(),
                now,
                "/user/" + request.serviceId() + emergencyRequestQueue,
                trackingNotificationTopic
        ));
    }
}
