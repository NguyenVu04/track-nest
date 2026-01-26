package project.tracknest.usertracking.domain.tracker.locationquery;

import io.grpc.stub.StreamObserver;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import project.tracknest.usertracking.core.datatype.LocationMessage;
import project.tracknest.usertracking.proto.lib.FamilyMemberLocation;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import static project.tracknest.usertracking.configuration.security.SecurityUtils.getCurrentUserId;

@Service
@Slf4j
class LocationObserverImpl implements LocationObserver, LocationStreamObserverRegistry {
    private final ConcurrentHashMap<UUID, Set<StreamObserver<FamilyMemberLocation>>> observers;

    public LocationObserverImpl() {
        this.observers = new ConcurrentHashMap<>();
    }

    @Override
    public void sendTargetLocation(UUID userId, LocationMessage message) {
        //TODO: save connection to redis to support multiple instances
        observers.computeIfPresent(userId, (_, observers) -> {
            observers.forEach(observer -> {
                FamilyMemberLocation response = FamilyMemberLocation.newBuilder()
                        .setMemberId(message.userId().toString())
                        .setMemberUsername(message.username())
                        .setTimestampMs(message.timestampMs())
                        .setLatitudeDeg(message.latitudeDeg())
                        .setLongitudeDeg(message.longitudeDeg())
                        .setAccuracyMeter(message.accuracyMeter())
                        .setVelocityMps(message.velocityMps())
                        .setOnline(true)
                        .setLastActiveMs(message.timestampMs())
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
    public UUID register(StreamObserver<FamilyMemberLocation> observer) {
        UUID userId = getCurrentUserId();
        observers.computeIfAbsent(userId, _ -> ConcurrentHashMap.newKeySet())
                .add(observer);
        log.info("Observer registered for userId: {}", userId);
        log.info("Number of observers after registration {}", observers.size());
        return userId;
    }

    @Override
    public void unregister(UUID id, StreamObserver<FamilyMemberLocation> observer) {
        observers.computeIfPresent(id, (_, v) -> {
            v.remove(observer);
            return v.isEmpty() ? null : v;
        });
        log.info("Observer unregistered for userId: {}", id);
        log.info("Number of observers after unregistration {}", observers.size());
    }
}
