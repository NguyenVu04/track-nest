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
import project.tracknest.usertracking.core.entity.User;

import java.time.OffsetDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class DisconnectInactiveUsersJob implements Job {
    private static final int INACTIVE_SECONDS = 480; // 8 minutes
    private static final int PAGE_SIZE = 256;

    @Value("${app.kafka.topics[2]}")
    private String TOPIC;

    private static final String DISCONNECT_NOTIFICATION_TYPE = "USER_DISCONNECTED";
    private static final String DISCONNECT_NOTIFICATION_TITLE = "User has been disconnected";
    private static final String DISCONNECT_NOTIFICATION_BODY_TEMPLATE = "User %s has been disconnected due to inactivity at %s.";

    private final TrackerUserRepository userRepository;
    private final KafkaTemplate<String, TrackingNotificationMessage> kafkaTemplate;

    @Override
    @Transactional
    public void execute(JobExecutionContext context) {

        Pageable pageable = PageRequest.of(0, PAGE_SIZE);

        OffsetDateTime threshold = OffsetDateTime.now()
                .minusSeconds(INACTIVE_SECONDS);

        Page<User> page;

        do {
            page = userRepository.findInactiveUsersSince(threshold, pageable);

            if (page.isEmpty()) {
                break;
            }

            for (User user : page.getContent()) {

                user.setConnected(false);
                log.info("Disconnected inactive user with id {}", user.getId());

                String body = String.format(DISCONNECT_NOTIFICATION_BODY_TEMPLATE, user.getUsername(), OffsetDateTime.now());
                TrackingNotificationMessage notification = new TrackingNotificationMessage(
                        user.getId(),
                        DISCONNECT_NOTIFICATION_TYPE,
                        DISCONNECT_NOTIFICATION_TITLE,
                        body
                );
                kafkaTemplate.send(TOPIC, notification);

            }

            userRepository.saveAll(page.getContent());

            pageable = page.nextPageable();

        } while (page.hasNext());

    }

}
