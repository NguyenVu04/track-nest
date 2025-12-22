package project.tracknest.usertracking.domain.tracker.locationcommand;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
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
    private final LocationCommandRepository locationRepository;
    private final LocationMessageProducer messageProducer;
    private final LocationCommandUserRepository userRepository;

    @Scheduled(fixedDelay = 1, timeUnit = TimeUnit.MINUTES)
    public void disconnectInactiveUsers() {
        //TODO: Disconnect users who have not sent location updates in the last 3 minutes
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

    @Override
    public void disconnectInactiveUsers(UUID userId) {

    }
}
