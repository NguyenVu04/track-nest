package project.tracknest.usertracking.domain.tracker.locationcommand.impl;

import com.google.rpc.Code;
import com.google.rpc.Status;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.usertracking.core.datatype.LocationMessage;
import project.tracknest.usertracking.core.entity.Location;
import project.tracknest.usertracking.core.entity.User;
import project.tracknest.usertracking.domain.anomalydetector.service.AnomalyDetectorHandler;
import project.tracknest.usertracking.domain.tracker.locationcommand.service.LocationCommandService;
import project.tracknest.usertracking.proto.lib.UpdateUserLocationRequest;
import project.tracknest.usertracking.proto.lib.UpdateUserLocationResponse;
import project.tracknest.usertracking.proto.lib.UserLocation;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
class LocationCommandServiceImpl implements LocationCommandService {
    private final TrackerLocationRepository locationRepository;
    private final LocationMessageProducer messageProducer;
    private final TrackerUserRepository userRepository;
    private final AnomalyDetectorHandler anomalyDetectorHandler;

    @Override
    @Transactional
    public UpdateUserLocationResponse updateUserLocation(UUID userId, UpdateUserLocationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User with ID {} not found", userId);
                    return new RuntimeException("User not found");
                });

        OffsetDateTime timestamp = OffsetDateTime.ofInstant(
                Instant.now(),
                ZoneOffset.UTC);

        user.setConnected(true);
        user.setLastActive(timestamp);
        userRepository.save(user);

        for (UserLocation userLocation : request.getLocationsList()) {
            Location location = Location.builder()
                    .latitude(userLocation.getLatitudeDeg())
                    .longitude(userLocation.getLongitudeDeg())
                    .accuracy(userLocation.getAccuracyMeter())
                    .velocity(userLocation.getVelocityMps())
                    .id(Location.LocationId
                            .builder()
                            .userId(userId)
                            .timestamp(timestamp)
                            .build())
                    .build();

            locationRepository.saveAndFlush(location);

            LocationMessage message = LocationMessage.builder()
                    .userId(userId)
                    .username(user.getUsername())
                    .avatarUrl(user.getAvatarUrl())
                    .latitudeDeg(userLocation.getLatitudeDeg())
                    .longitudeDeg(userLocation.getLongitudeDeg())
                    .accuracyMeter(userLocation.getAccuracyMeter())
                    .velocityMps(userLocation.getVelocityMps())
                    .timestampMs(userLocation.getTimestampMs())
                    .build();

            messageProducer.produce(message);
            anomalyDetectorHandler.detectAnomaly(
                    userId,
                    user.getUsername(),
                    userLocation.getLatitudeDeg(),
                    userLocation.getLongitudeDeg(),
                    timestamp
            );

            log.info("Received request to update location command");
        }

        return UpdateUserLocationResponse.newBuilder()
                .setStatus(Status.newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Location updated successfully")
                        .build())
                .build();
    }
}
