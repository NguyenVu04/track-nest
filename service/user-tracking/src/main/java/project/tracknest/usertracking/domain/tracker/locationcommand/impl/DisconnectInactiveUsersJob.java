package project.tracknest.usertracking.domain.tracker.locationcommand.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.usertracking.core.datatype.TrackingNotificationMessage;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class DisconnectInactiveUsersJob implements Job {
    private static final int INACTIVE_SECONDS = 480; // 8 minutes
    private static final int PAGE_SIZE = 256;

    @Value("${app.kafka.topics.tracking-notification}")
    private String TOPIC;

    private static final String DISCONNECT_NOTIFICATION_TYPE = "USER_DISCONNECTED";
    private static final String DISCONNECT_NOTIFICATION_TITLE = "Connection temporarily lost";
    private static final String DISCONNECT_NOTIFICATION_BODY_TEMPLATE = """
            We haven't received updates from %s for a short period.
            This is usually due to signal or battery conditions.
            """;

    private final TrackerUserRepository userRepository;
    private final KafkaTemplate<String, TrackingNotificationMessage> kafkaTemplate;

    @Override
    public void execute(JobExecutionContext context) {
        List<UserDisconnectView> disconnected = disconnectInDB();
        disconnected.forEach(user -> {
            log.info("Sending disconnect notification for user {}", user.getId());
            String body = String.format(DISCONNECT_NOTIFICATION_BODY_TEMPLATE, user.getUsername());
            kafkaTemplate.send(TOPIC, new TrackingNotificationMessage(
                    user.getId(), body, DISCONNECT_NOTIFICATION_TITLE, DISCONNECT_NOTIFICATION_TYPE));
        });
    }

    @Transactional
    protected List<UserDisconnectView> disconnectInDB() {
        OffsetDateTime threshold = OffsetDateTime.now().minusSeconds(INACTIVE_SECONDS);
        Pageable pageable = PageRequest.of(0, PAGE_SIZE);
        List<UserDisconnectView> all = new ArrayList<>();
        Page<UserDisconnectView> page;

        do {
            page = userRepository.findInactiveUsersSince(threshold, pageable);
            if (page.isEmpty()) break;

            List<UUID> ids = page.getContent().stream()
                    .map(UserDisconnectView::getId)
                    .toList();

            userRepository.disconnectUsersById(ids);
            all.addAll(page.getContent());
            page.getContent().forEach(u -> log.info("Disconnected inactive user {}", u.getId()));

        } while (page.hasNext());

        return all;
    }
}
