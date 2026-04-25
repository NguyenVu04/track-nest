package project.tracknest.usertracking.domain.tracker.locationquery.impl;

import io.grpc.stub.StreamObserver;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import project.tracknest.usertracking.configuration.common.ServerIdProvider;
import project.tracknest.usertracking.configuration.redis.GrpcSessionService;
import project.tracknest.usertracking.core.datatype.LocationMessage;
import project.tracknest.usertracking.domain.tracker.locationquery.service.LocationStreamObserverRegistry;
import project.tracknest.usertracking.proto.lib.FamilyMemberLocation;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
class LocationObserverImpl implements LocationObserver, LocationStreamObserverRegistry {
    private static final String SEPARATOR = ":";

    private final GrpcSessionService grpcSessionService;
    private final ServerIdProvider serverIdProvider;
    private final ConcurrentHashMap<String, Set<StreamObserver<FamilyMemberLocation>>> observers;

    public LocationObserverImpl(
            GrpcSessionService grpcSessionService,
            ServerIdProvider serverIdProvider
    ) {
        this.observers = new ConcurrentHashMap<>();
        this.grpcSessionService = grpcSessionService;
        this.serverIdProvider = serverIdProvider;
    }

    @Override
    public void sendTargetLocation(UUID userId, LocationMessage message) {
        List<String> sessionIds = listUserSessions(userId);

        FamilyMemberLocation response = FamilyMemberLocation.newBuilder()
                .setMemberId(message.userId().toString())
                .setMemberUsername(message.username())
                .setMemberAvatarUrl(message.avatarUrl() != null
                        ? message.avatarUrl()
                        : "")
                .setTimestampMs(message.timestampMs())
                .setLatitudeDeg(message.latitudeDeg())
                .setLongitudeDeg(message.longitudeDeg())
                .setAccuracyMeter(message.accuracyMeter())
                .setVelocityMps(message.velocityMps())
                .setOnline(true)
                .setLastActiveMs(message.timestampMs())
                .build();

        for (String sessionId : sessionIds) {
            observers.computeIfPresent(sessionId, (_, sessionObservers) -> {
                List<StreamObserver<FamilyMemberLocation>> failed = new ArrayList<>();

                for (var observer : sessionObservers) {
                    try {
                        observer.onNext(response);
                    } catch (Exception e) {
                        failed.add(observer);
                    }
                }

                failed.forEach(observer -> unregister(sessionId, observer));
                return sessionObservers;
            });
        }
    }

    private String generateSessionId(UUID userId, UUID circleId) {
        return userId.toString() + SEPARATOR + circleId.toString();
    }

    private List<String> listUserSessions(UUID userId) {
        String prefix = userId.toString() + SEPARATOR;
        List<String> sessionIds = new ArrayList<>();

        for (String sessionId : observers.keySet()) {
            if (sessionId.startsWith(prefix)) {
                sessionIds.add(sessionId);
            }
        }

        return sessionIds;
    }

    @Override
    public List<UUID> listConnectedUsers() {
        Set<UUID> userIds = new HashSet<>();

        for (String sessionId : observers.keySet()) {
            String userIdStr = sessionId.split(SEPARATOR)[0];
            try {
                userIds.add(UUID.fromString(userIdStr));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid session ID format: {}", sessionId);
            }
        }

        return new ArrayList<>(userIds);
    }

    @Override
    public String register(UUID userId, UUID circleId, StreamObserver<FamilyMemberLocation> observer) {
        String sessionId = generateSessionId(userId, circleId);

        observers.computeIfAbsent(sessionId, _ -> ConcurrentHashMap.newKeySet())
                .add(observer);

        grpcSessionService.addServer(userId, serverIdProvider.getServerId());

        log.info("Observer registered for userId: {}", userId);
        log.info("Number of observers after registration {}", observers.size());
        return sessionId;
    }

    @Override
    public void unregister(String sessionId, StreamObserver<FamilyMemberLocation> observer) {
        observers.computeIfPresent(sessionId, (_, v) -> {
            v.remove(observer);
            return v.isEmpty() ? null : v;
        });
        log.info("Observer unregistered with Session ID: {}", sessionId);
        log.info("Number of observers after unregistration {}", observers.size());
    }

    @PreDestroy
    public void onShutdown() {
        String serverId = serverIdProvider.getServerId();
        listConnectedUsers().forEach(userId ->
                grpcSessionService.removeServer(userId, serverId));
        log.info("Removed server {} from all gRPC sessions on shutdown", serverId);
    }
}
