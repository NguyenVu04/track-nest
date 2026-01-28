package project.tracknest.usertracking.domain.tracker.locationcommand.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.usertracking.core.entity.User;

import java.time.OffsetDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class DisconnectInactiveUsersJob implements Job {
    private static final int INACTIVE_SECONDS = 480; // 8 minutes
    private static final int PAGE_SIZE = 256;

    private final TrackerUserRepository userRepository;

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
                //TODO: send disconnect notification to user via firebase
                user.setConnected(false);
                log.info("Disconnected inactive user with id {}", user.getId());
            }

            userRepository.saveAll(page.getContent());

            pageable = page.nextPageable();

        } while (page.hasNext());

    }

}
