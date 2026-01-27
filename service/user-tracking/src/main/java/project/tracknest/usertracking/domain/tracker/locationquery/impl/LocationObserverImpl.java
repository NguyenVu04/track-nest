package project.tracknest.usertracking.domain.tracker.locationquery.impl;

import io.grpc.stub.StreamObserver;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import project.tracknest.usertracking.core.datatype.LocationMessage;
import project.tracknest.usertracking.domain.tracker.locationquery.service.LocationStreamObserverRegistry;
import project.tracknest.usertracking.proto.lib.FamilyMemberLocation;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

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
            List<StreamObserver<FamilyMemberLocation>> failed = new ArrayList<>();

            FamilyMemberLocation response = FamilyMemberLocation.newBuilder()
                    .setMemberId(message.userId().toString())
                    .setMemberUsername(message.username())
                    .setMemberAvatarUrl(message.avatarUrl())
                    .setTimestampMs(message.timestampMs())
                    .setLatitudeDeg(message.latitudeDeg())
                    .setLongitudeDeg(message.longitudeDeg())
                    .setAccuracyMeter(message.accuracyMeter())
                    .setVelocityMps(message.velocityMps())
                    .setOnline(true)
                    .setLastActiveMs(message.timestampMs())
                    .build();

            for (var observer : observers) {
                try {
                    observer.onNext(response);
                } catch (Exception e) {
                    failed.add(observer);
                }
            }

            failed.forEach(observer -> unregister(userId, observer));

            return observers;
        });
    }

    @Override
    public UUID register(UUID userId, StreamObserver<FamilyMemberLocation> observer) {
        observers.computeIfAbsent(userId, _ -> ConcurrentHashMap.newKeySet())
                .add(observer);
        log.info("Observer registered for userId: {}", userId);
        log.info("Number of observers after registration {}", observers.size());
        return userId;
    }

    @Override
    public void unregister(UUID userId, StreamObserver<FamilyMemberLocation> observer) {
        observers.computeIfPresent(userId, (_, v) -> {
            v.remove(observer);
            return v.isEmpty() ? null : v;
        });
        log.info("Observer unregistered for userId: {}", userId);
        log.info("Number of observers after unregistration {}", observers.size());
    }
}
