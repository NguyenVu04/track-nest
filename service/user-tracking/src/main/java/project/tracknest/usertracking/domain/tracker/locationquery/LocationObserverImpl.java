package project.tracknest.usertracking.domain.tracker.locationquery;

import io.grpc.stub.StreamObserver;
import org.springframework.stereotype.Service;
import project.tracknest.usertracking.core.datatype.LocationMessage;
import project.tracknest.usertracking.proto.lib.LocationResponse;

import java.util.UUID;

@Service
public class LocationObserverImpl implements LocationObserver, LocationStreamObserverRegistry {
    @Override
    public void sendTargetLocation(UUID userId, LocationMessage message) {

    }

    @Override
    public void register(StreamObserver<LocationResponse> observer) {

    }

    @Override
    public void unregister() {

    }
}
