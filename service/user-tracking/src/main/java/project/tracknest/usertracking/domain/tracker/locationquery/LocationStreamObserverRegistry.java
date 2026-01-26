package project.tracknest.usertracking.domain.tracker.locationquery;

import io.grpc.stub.StreamObserver;
import project.tracknest.usertracking.proto.lib.FamilyMemberLocation;

import java.util.UUID;

public interface LocationStreamObserverRegistry {
    UUID register(StreamObserver<FamilyMemberLocation> observer);
    void unregister(UUID id, StreamObserver<FamilyMemberLocation> observer);
}
