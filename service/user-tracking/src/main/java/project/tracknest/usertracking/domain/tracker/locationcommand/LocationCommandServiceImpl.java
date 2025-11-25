package project.tracknest.usertracking.domain.tracker.locationcommand;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import project.tracknest.usertracking.core.datatype.LocationMessage;
import project.tracknest.usertracking.core.entity.Location;
import project.tracknest.usertracking.proto.lib.LocationRequest;

import java.util.UUID;

import static project.tracknest.usertracking.configuration.security.SecurityUtils.getCurrentUserId;

@Service
@RequiredArgsConstructor
public class LocationCommandServiceImpl implements LocationCommandService {
    private final LocationCommandRepository locationRepository;
    private final LocationMessageProducer messageProducer;

    @Override
    public void updateLocation(LocationRequest request) {
        UUID userId = getCurrentUserId();
        //!TODO: Add update user connected status
        Location location = Location.builder()
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .accuracy(request.getAccuracy())
                .velocity(request.getVelocity())
                .userId(userId)
                .build();

        locationRepository.save(location);

        LocationMessage message = LocationMessage.builder()
                .userId(userId)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .accuracy(request.getAccuracy())
                .velocity(request.getVelocity())
                .build();

        messageProducer.produce(message);
    }
}
