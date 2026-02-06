package project.tracknest.usertracking.configuration.firebase;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class FcmService {

    public void sendToTokens(List<String> tokens, String title, String body) {

        Notification notification = Notification.builder()
                .setTitle(title)
                .setBody(body)
                .build();

        tokens.forEach(
                token -> {
                    Message message = Message.builder()
                            .setToken(token)
                            .setNotification(notification)
                            .build();
                    try {
                        FirebaseMessaging.getInstance()
                                .send(message);
                    } catch (FirebaseMessagingException e) {
                        log.error("Error sending FCM message to token {}: {}",
                                token,
                                e.getMessage());
                    }
                }
        );
    }

}
