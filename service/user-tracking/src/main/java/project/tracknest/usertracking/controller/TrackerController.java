package project.tracknest.usertracking.controller;

import com.google.protobuf.Empty;
import com.google.protobuf.StringValue;
import io.grpc.stub.ServerCallStreamObserver;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.grpc.server.service.GrpcService;
import project.tracknest.usertracking.core.datatype.KeycloakUserDetails;
import project.tracknest.usertracking.domain.tracker.locationcommand.LocationCommandService;
import project.tracknest.usertracking.domain.tracker.locationquery.LocationQueryService;
import project.tracknest.usertracking.domain.tracker.locationquery.LocationStreamObserverRegistry;
import project.tracknest.usertracking.proto.lib.LocationHistoryRequest;
import project.tracknest.usertracking.proto.lib.LocationRequest;
import project.tracknest.usertracking.proto.lib.LocationResponse;
import project.tracknest.usertracking.proto.lib.TrackerControllerGrpc;

import java.util.List;
import java.util.UUID;

import static project.tracknest.usertracking.configuration.security.SecurityUtils.getCurrentUserDetails;

@GrpcService
@RequiredArgsConstructor
@Slf4j
public class TrackerController extends TrackerControllerGrpc.TrackerControllerImplBase {
    private final LocationQueryService queryService;
    private final LocationCommandService commandService;
    private final LocationStreamObserverRegistry registry;

    @Override
    public StreamObserver<LocationRequest> postLocation(StreamObserver<Empty> responseObserver) {
        final KeycloakUserDetails userDetails = getCurrentUserDetails();
        return new StreamObserver<>() {
            @Override
            public void onNext(LocationRequest request) {
                commandService.updateLocation(
                        userDetails.getUserId(),
                        userDetails.getUsername(),
                        request);
            }

            @Override
            public void onError(Throwable t) {
                log.warn("Error receiving location stream from user {}", userDetails.getUserId());
            }

            @Override
            public void onCompleted() {
                log.info("Location stream from user {} completed", userDetails.getUserId());
                responseObserver.onNext(Empty.getDefaultInstance());
                responseObserver.onCompleted();
            }
        };
    }

    @Override
    public void getTargetsLastLocations(Empty request, StreamObserver<LocationResponse> responseObserver) {
        final UUID trackerId = getCurrentUserDetails().getUserId();

        List<LocationResponse> responses = queryService.retrieveTargetsLastLocations(trackerId);

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
    public void getTargetLocationHistory(LocationHistoryRequest request, StreamObserver<LocationResponse> responseObserver) {
        final UUID trackerId = getCurrentUserDetails().getUserId();

        List<LocationResponse> responses = queryService.retrieveTargetLocationHistory(trackerId, request);
        responses.forEach(responseObserver::onNext);

        responseObserver.onCompleted();
    }
}
