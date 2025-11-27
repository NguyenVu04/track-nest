package project.tracknest.usertracking.domain.tracker.locationquery;

import io.grpc.stub.StreamObserver;
import project.tracknest.usertracking.proto.lib.LocationResponse;

import java.util.UUID;

public interface LocationStreamObserverRegistry {
    UUID register(StreamObserver<LocationResponse> observer);
    void unregister(UUID id, StreamObserver<LocationResponse> observer);
}
