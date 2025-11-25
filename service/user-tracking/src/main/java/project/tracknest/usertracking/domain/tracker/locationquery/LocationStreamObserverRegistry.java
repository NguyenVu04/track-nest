package project.tracknest.usertracking.domain.tracker.locationquery;

import io.grpc.stub.StreamObserver;
import project.tracknest.usertracking.proto.lib.LocationResponse;

public interface LocationStreamObserverRegistry {
    void register(StreamObserver<LocationResponse> observer);
    void unregister();
}
