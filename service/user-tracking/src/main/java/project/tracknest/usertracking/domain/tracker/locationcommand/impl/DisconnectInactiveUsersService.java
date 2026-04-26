package project.tracknest.usertracking.domain.tracker.locationcommand.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
class DisconnectInactiveUsersService {
    private static final int INACTIVE_SECONDS = 480;
    private static final int PAGE_SIZE = 256;

    private final TrackerUserRepository userRepository;

    @Transactional
    public List<UserDisconnectView> disconnectInDB() {
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
