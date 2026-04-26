package project.tracknest.usertracking.domain.tracker.locationquery.service;

import io.grpc.stub.StreamObserver;
import project.tracknest.usertracking.proto.lib.FamilyMemberLocation;

import java.util.List;
import java.util.UUID;

public interface LocationStreamObserverRegistry {
    List<UUID> listConnectedUsers();
    String register(UUID userId, UUID circleId, StreamObserver<FamilyMemberLocation> observer);
    void unregister(String sessionId, StreamObserver<FamilyMemberLocation> observer);
}
