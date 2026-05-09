package project.tracknest.usertracking.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.tracknest.usertracking.domain.familymessenger.service.FamilyMessengerService;

import java.util.UUID;

/**
 * Test-only endpoint for verifying that a family-chat FCM push notification
 * is delivered to the correct circle members.
 *
 * <p>Fires the same FCM path as a real {@code sendMessage} gRPC call
 * (all circle members except the sender, same data payload shape),
 * but does not create a {@code FamilyMessage} DB row.
 */
@RestController
@RequestMapping("/test/notifications")
@RequiredArgsConstructor
@Slf4j
public class TestNotificationController {

    private final FamilyMessengerService familyMessengerService;

    // ── Request / Response ────────────────────────────────────────────────

    public record FamilyMessageNotificationRequest(
            UUID circleId,
            UUID senderId,
            String senderName,
            String content
    ) {}

    public record FamilyMessageNotificationResponse(
            UUID circleId,
            int tokensSent,
            String note
    ) {}

    // ── Endpoint ──────────────────────────────────────────────────────────

    /**
     * Sends a test FCM push to all members of {@code circleId} except
     * {@code senderId}, using the standard chat-message payload shape:
     * <pre>
     *   title  = senderName
     *   body   = content
     *   data   = { type: "chat_message",
     *              route: "/(app)/(tabs)/family-chat",
     *              circleId: "&lt;circleId&gt;" }
     * </pre>
     *
     * @param request circleId   – target family circle<br>
     *                senderId   – excluded from notification (simulates the sender)<br>
     *                senderName – notification title shown on the device<br>
     *                content    – notification body shown on the device
     */
    @PostMapping("/family-message")
    public ResponseEntity<FamilyMessageNotificationResponse> testFamilyMessageNotification(
            @RequestBody FamilyMessageNotificationRequest request) {

        int sent = familyMessengerService.sendTestFamilyMessageNotification(
                request.circleId(),
                request.senderId(),
                request.senderName(),
                request.content());

        String note = sent < 0
                ? "FCM batch rejected — check Firebase credentials"
                : sent == 0
                ? "No FCM tokens found for recipients (no registered devices, or only sender in circle)"
                : "Notification dispatched";

        return ResponseEntity.ok(new FamilyMessageNotificationResponse(
                request.circleId(), sent, note));
    }
}
