package project.tracknest.usertracking.domain.tracker.locationquery.service;

import io.grpc.stub.StreamObserver;
import project.tracknest.usertracking.proto.lib.FamilyMemberLocation;

import java.util.UUID;

public interface LocationStreamObserverRegistry {
    UUID register(UUID userId, StreamObserver<FamilyMemberLocation> observer);
    void unregister(UUID userId, StreamObserver<FamilyMemberLocation> observer);
}
