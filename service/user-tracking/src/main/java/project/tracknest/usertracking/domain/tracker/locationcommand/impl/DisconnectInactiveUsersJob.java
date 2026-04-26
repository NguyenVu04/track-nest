package project.tracknest.usertracking.domain.tracker.locationcommand.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import project.tracknest.usertracking.core.datatype.TrackingNotificationMessage;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DisconnectInactiveUsersJob implements Job {
    @Value("${app.kafka.topics.tracking-notification}")
    private String TOPIC;

    private static final String DISCONNECT_NOTIFICATION_TYPE = "USER_DISCONNECTED";
    private static final String DISCONNECT_NOTIFICATION_TITLE = "Connection temporarily lost";
    private static final String DISCONNECT_NOTIFICATION_BODY_TEMPLATE = """
            We haven't received updates from %s for a short period.
            This is usually due to signal or battery conditions.
            """;

    private final DisconnectInactiveUsersService disconnectService;
    private final KafkaTemplate<String, TrackingNotificationMessage> kafkaTemplate;

    @Override
    public void execute(JobExecutionContext context) {
        List<UserDisconnectView> disconnected = disconnectService.disconnectInDB();
        disconnected.forEach(user -> {
            log.info("Sending disconnect notification for user {}", user.getId());
            String body = String.format(DISCONNECT_NOTIFICATION_BODY_TEMPLATE, user.getUsername());
            kafkaTemplate.send(TOPIC, new TrackingNotificationMessage(
                    user.getId(), body, DISCONNECT_NOTIFICATION_TITLE, DISCONNECT_NOTIFICATION_TYPE));
        });
    }
}
