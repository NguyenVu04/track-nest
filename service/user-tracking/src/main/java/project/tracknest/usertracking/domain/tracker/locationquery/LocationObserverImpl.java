package project.tracknest.usertracking.domain.tracker.locationquery;

import io.grpc.stub.StreamObserver;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import project.tracknest.usertracking.core.datatype.LocationMessage;
import project.tracknest.usertracking.proto.lib.LocationResponse;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import static project.tracknest.usertracking.configuration.security.SecurityUtils.getCurrentUserId;

@Service
@Slf4j
class LocationObserverImpl implements LocationObserver, LocationStreamObserverRegistry {
    private final ConcurrentHashMap<UUID, Set<StreamObserver<LocationResponse>>> observers;

    public LocationObserverImpl() {
        this.observers = new ConcurrentHashMap<>();
    }

    @Override
    public void sendTargetLocation(UUID userId, LocationMessage message) {
        //TODO: save connection to redis to support multiple instances
        observers.computeIfPresent(userId, (_, observers) -> {
            observers.forEach(observer -> {
                LocationResponse response = LocationResponse.newBuilder()
                        .setUserId(message.userId().toString())
                        .setUsername(message.username())
                        .setTimestamp(message.timestamp())
                        .setLatitude(message.latitude())
                        .setLongitude(message.longitude())
                        .setAccuracy(message.accuracy())
                        .setVelocity(message.velocity())
                        .build();
                try {
                    observer.onNext(response);
                } catch (Exception e) {
                    observer.onError(e);
                    observers.remove(observer);
                    log.error("Error sending location update to observer for userId: {}", userId, e);
                }
            });
            return observers;
        });
    }

    @Override
    public UUID register(StreamObserver<LocationResponse> observer) {
        UUID userId = getCurrentUserId();
        observers.computeIfAbsent(userId, _ -> ConcurrentHashMap.newKeySet())
                .add(observer);
        log.info("Observer registered for userId: {}", userId);
        log.info("Number of observers after registration {}", observers.size());
        return userId;
    }

    @Override
    public void unregister(UUID id, StreamObserver<LocationResponse> observer) {
        observers.computeIfPresent(id, (_, v) -> {
            v.remove(observer);
            return v.isEmpty() ? null : v;
        });
        log.info("Observer unregistered for userId: {}", id);
        log.info("Number of observers after unregistration {}", observers.size());
    }
}
