package project.tracknest.usertracking.domain.tracker.locationcommand;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.usertracking.core.datatype.LocationMessage;
import project.tracknest.usertracking.core.entity.Location;
import project.tracknest.usertracking.core.entity.User;
import project.tracknest.usertracking.proto.lib.LocationRequest;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocationCommandServiceImpl implements LocationCommandService {
    @Value("${app.user-location.inactive-seconds:180}")
    private int inactiveSeconds;

    private final LocationCommandRepository locationRepository;
    private final LocationMessageProducer messageProducer;
    private final LocationCommandUserRepository userRepository;

    @Scheduled(fixedDelay = 30, timeUnit = TimeUnit.SECONDS)
    @Transactional
    public void disconnectInactiveUsers() {
                Pageable pageable = PageRequest.of(0, 256);
        OffsetDateTime threshold = OffsetDateTime.now()
                .minusSeconds(inactiveSeconds);
        var inactiveUsers = userRepository.findInactiveUsersSince(threshold, pageable);
        for (User user : inactiveUsers) {
            user.setConnected(false);
            log.info("Disconnected inactive user with id {}", user.getId());
        }
        userRepository.saveAll(inactiveUsers);
        //!TODO: notify trackers about user disconnection
    }

    @Override
    @Transactional
    public void updateLocation(UUID userId, String username, LocationRequest request) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            log.warn("User with id {} not found. Cannot update location.", userId);
            return;
        }

        OffsetDateTime timestamp = OffsetDateTime.ofInstant(
                Instant.ofEpochSecond(
                        request.getTimestamp()),
                ZoneOffset.UTC);

        User user = userOpt.get();
        user.setConnected(true);
        user.setLastActive(timestamp);
        userRepository.save(user);

        Location location = Location.builder()
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .accuracy(request.getAccuracy())
                .velocity(request.getVelocity())
                .id(Location.LocationId
                        .builder()
                        .userId(userId)
                        .timestamp(timestamp)
                        .build())
                .build();

        locationRepository.save(location);

        LocationMessage message = LocationMessage.builder()
                .userId(userId)
                .username(username)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .accuracy(request.getAccuracy())
                .velocity(request.getVelocity())
                .timestamp(request.getTimestamp())
                .build();

        messageProducer.produce(message);

        log.info("Received request to update location command");
    }
}
