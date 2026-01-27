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
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocationCommandServiceImpl implements LocationCommandService {
    private final LocationRepository locationRepository;
    private final LocationMessageProducer messageProducer;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public UpdateUserLocationResponse updateUserLocation(UUID userId, String username, UpdateUserLocationRequest request) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            log.warn("User with id {} not found. Cannot update location.", userId);
            return UpdateUserLocationResponse
                    .newBuilder()
                    .setStatus(Status
                            .newBuilder()
                            .setCode(Code.INTERNAL_VALUE)
                            .setMessage("User not found")
                            .build())
                    .build();
        }

        OffsetDateTime timestamp = OffsetDateTime.ofInstant(
                Instant.ofEpochMilli(
                        request.getTimestampMs()),
                ZoneOffset.UTC);

        User user = userOpt.get();
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

        locationRepository.save(location);

        LocationMessage message = LocationMessage.builder()
                .userId(userId)
                .username(username)
                .latitudeDeg(request.getLatitudeDeg())
                .longitudeDeg(request.getLongitudeDeg())
                .accuracyMeter(request.getAccuracyMeter())
                .velocityMps(request.getVelocityMps())
                .timestampMs(request.getTimestampMs())
                .build();

        messageProducer.produce(message);

        log.info("Received request to update location command");

        return UpdateUserLocationResponse
                .newBuilder()
                .setStatus(Status
                        .newBuilder()
                        .setCode(Code.OK.getNumber())
                        .setMessage("Location updated successfully")
                        .build())
                .build();
    }
}
