package project.tracknest.usertracking.configuration.firebase;

import com.google.firebase.messaging.BatchResponse;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.MulticastMessage;
import com.google.firebase.messaging.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class FcmService {

    /**
     * Sends a push notification to all provided tokens using FCM multicast.
     *
     * @return number of tokens that received the notification successfully, or -1 on total failure
     */
    public int sendToTokens(List<String> tokens, String title, String body) {
        if (tokens.isEmpty()) {
            return 0;
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
            int failureCount = response.getFailureCount();
            if (failureCount > 0) {
                log.warn("FCM multicast: {}/{} messages failed", failureCount, tokens.size());
            }
            return response.getSuccessCount();
        } catch (FirebaseMessagingException e) {
            log.error("FCM multicast failed entirely for {} tokens: {}", tokens.size(), e.getMessage(), e);
            return -1;
        }
    }

    /**
     * Sends a push notification with additional data payload to all provided tokens.
     *
     * @param data extra key/value pairs attached to the FCM message (for client-side routing, etc.)
     * @return number of tokens that received the notification successfully, or -1 on total failure
     */
    public int sendToTokensWithData(List<String> tokens, String title, String body, Map<String, String> data) {
        if (tokens.isEmpty()) {
            return 0;
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
            int failureCount = response.getFailureCount();
            if (failureCount > 0) {
                log.warn("FCM multicast with data: {}/{} messages failed", failureCount, tokens.size());
            }
            return response.getSuccessCount();
        } catch (FirebaseMessagingException e) {
            log.error("FCM multicast with data failed entirely for {} tokens: {}", tokens.size(), e.getMessage(), e);
            return -1;
        }
    }
}
