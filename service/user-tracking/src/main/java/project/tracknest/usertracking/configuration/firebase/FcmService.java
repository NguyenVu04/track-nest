package project.tracknest.usertracking.configuration.firebase;

import com.google.firebase.messaging.BatchResponse;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.MessagingErrorCode;
import com.google.firebase.messaging.MulticastMessage;
import com.google.firebase.messaging.Notification;
import com.google.firebase.messaging.SendResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class FcmService {

    public record FcmResult(int successCount, List<String> staleTokens) {}

    private static final List<MessagingErrorCode> STALE_TOKEN_ERRORS = List.of(
            MessagingErrorCode.UNREGISTERED,
            MessagingErrorCode.INVALID_ARGUMENT
    );

    public FcmResult sendToTokens(List<String> tokens, String title, String body) {
        if (tokens.isEmpty()) {
            return new FcmResult(0, List.of());
        }

        Notification notification = Notification.builder()
                .setTitle(title)
                .setBody(body)
                .build();

        MulticastMessage message = MulticastMessage.builder()
                .addAllTokens(tokens)
                .setNotification(notification)
                .build();

        try {
            BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(message);
            if (response.getFailureCount() > 0) {
                log.warn("FCM multicast: {}/{} messages failed", response.getFailureCount(), tokens.size());
            }
            return collectResult(tokens, response);
        } catch (FirebaseMessagingException e) {
            log.error("FCM multicast failed entirely for {} tokens: {}", tokens.size(), e.getMessage(), e);
            return new FcmResult(-1, List.of());
        }
    }

    public FcmResult sendToTokensWithData(List<String> tokens, String title, String body, Map<String, String> data) {
        if (tokens.isEmpty()) {
            return new FcmResult(0, List.of());
        }

        Notification notification = Notification.builder()
                .setTitle(title)
                .setBody(body)
                .build();

        MulticastMessage message = MulticastMessage.builder()
                .addAllTokens(tokens)
                .setNotification(notification)
                .putAllData(data)
                .build();

        try {
            BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(message);
            if (response.getFailureCount() > 0) {
                log.warn("FCM multicast with data: {}/{} messages failed", response.getFailureCount(), tokens.size());
            }
            return collectResult(tokens, response);
        } catch (FirebaseMessagingException e) {
            log.error("FCM multicast with data failed entirely for {} tokens: {}", tokens.size(), e.getMessage(), e);
            return new FcmResult(-1, List.of());
        }
    }

    private FcmResult collectResult(List<String> tokens, BatchResponse response) {
        List<SendResponse> responses = response.getResponses();
        List<String> staleTokens = new ArrayList<>();
        for (int i = 0; i < responses.size(); i++) {
            SendResponse sr = responses.get(i);
            if (!sr.isSuccessful()) {
                processFailedResponse(tokens.get(i), sr, staleTokens);
            }
        }
        return new FcmResult(response.getSuccessCount(), staleTokens);
    }

    private void processFailedResponse(String token, SendResponse sr, List<String> staleTokens) {
        FirebaseMessagingException ex = sr.getException();
        MessagingErrorCode messagingCode = ex != null ? ex.getMessagingErrorCode() : null;
        String errorLabel = resolveErrorLabel(ex, messagingCode);
        log.warn("FCM delivery failed for token ...{}: errorCode={}",
                token.substring(Math.max(0, token.length() - 8)), errorLabel);
        if (messagingCode != null && STALE_TOKEN_ERRORS.contains(messagingCode)) {
            staleTokens.add(token);
        }
    }

    private static String resolveErrorLabel(FirebaseMessagingException ex, MessagingErrorCode messagingCode) {
        if (messagingCode != null) {
            return messagingCode.name();
        }
        if (ex != null) {
            return ex.getErrorCode().name();
        }
        return "UNKNOWN";
    }
}
