package project.tracknest.usertracking.controller;

import com.google.protobuf.Empty;
import com.google.protobuf.StringValue;
import io.grpc.stub.ServerCallStreamObserver;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.grpc.server.service.GrpcService;
import project.tracknest.usertracking.domain.tracker.locationcommand.LocationCommandService;
import project.tracknest.usertracking.domain.tracker.locationquery.LocationQueryService;
import project.tracknest.usertracking.domain.tracker.locationquery.LocationStreamObserverRegistry;
import project.tracknest.usertracking.proto.lib.LocationRequest;
import project.tracknest.usertracking.proto.lib.LocationResponse;
import project.tracknest.usertracking.proto.lib.TrackerControllerGrpc;

import java.util.List;
import java.util.UUID;

import static project.tracknest.usertracking.configuration.security.SecurityUtils.getCurrentUserId;

@GrpcService
@RequiredArgsConstructor
@Slf4j
public class TrackerController extends TrackerControllerGrpc.TrackerControllerImplBase {
    private final LocationQueryService queryService;
    private final LocationCommandService commandService;
    private final LocationStreamObserverRegistry registry;

    @Override
    public StreamObserver<LocationRequest> postLocation(StreamObserver<Empty> responseObserver) {
        final UUID userId = getCurrentUserId();
        return new StreamObserver<>() {
            @Override
            public void onNext(LocationRequest request) {
                commandService.updateLocation(userId, request);
            }

            @Override
            public void onError(Throwable t) {
                //!TODO: handle error by sending notification to guardians
                log.error("Error receiving location data", t);
            }

            @Override
            public void onCompleted() {
                responseObserver.onNext(Empty.getDefaultInstance());
                responseObserver.onCompleted();
            }
        };
    }

    @Override
    public void getTargetsLastLocations(Empty request, StreamObserver<LocationResponse> responseObserver) {
        List<LocationResponse> responses = queryService.retrieveTargetsLastLocation();

        for (LocationResponse response : responses) {
            responseObserver.onNext(response);
        }

        if (responseObserver instanceof ServerCallStreamObserver<LocationResponse> observer) {
            final UUID id = registry.register(observer);

            observer.setOnCancelHandler(() -> {
                registry.unregister(id, observer);
                log.info("Client cancelled the stream, observer unregistered.");
            });

            return;
        }

        responseObserver.onCompleted();
    }

    @Override
    public void getTargetLocationHistory(StringValue targetId, StreamObserver<LocationResponse> responseObserver) {
        UUID targetUuid = UUID.fromString(targetId.getValue());
        List<LocationResponse> responses = queryService.retrieveTargetLocationHistory(targetUuid);
        for (LocationResponse response : responses) {
            responseObserver.onNext(response);
        }
    }
}
