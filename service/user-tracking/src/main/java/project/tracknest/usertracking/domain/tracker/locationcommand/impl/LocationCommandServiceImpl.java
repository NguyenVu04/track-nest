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
import project.tracknest.usertracking.domain.tracker.locationcommand.service.LocationCommandService;
import project.tracknest.usertracking.domain.tracker.locationcommand.service.LocationMessageProducer;
import project.tracknest.usertracking.proto.lib.UpdateUserLocationRequest;
import project.tracknest.usertracking.proto.lib.UpdateUserLocationResponse;

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

    @Override
    @Transactional
    public UpdateUserLocationResponse updateUserLocation(UUID userId, UpdateUserLocationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User with ID {} not found", userId);
                    return new RuntimeException("User not found");
                });

        OffsetDateTime timestamp = OffsetDateTime.ofInstant(
                Instant.ofEpochMilli(
                        request.getTimestampMs()),
                ZoneOffset.UTC);

        user.setConnected(true);
        user.setLastActive(timestamp);
        userRepository.save(user);

        Location location = Location.builder()
                .latitude(request.getLatitudeDeg())
                .longitude(request.getLongitudeDeg())
                .accuracy(request.getAccuracyMeter())
                .velocity(request.getVelocityMps())
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
                .latitudeDeg(request.getLatitudeDeg())
                .longitudeDeg(request.getLongitudeDeg())
                .accuracyMeter(request.getAccuracyMeter())
                .velocityMps(request.getVelocityMps())
                .timestampMs(request.getTimestampMs())
                .build();

        messageProducer.produce(message);

        log.info("Received request to update location command");

        return UpdateUserLocationResponse.newBuilder()
                .setStatus(Status.newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Location updated successfully")
                        .build())
                .build();
    }
}
