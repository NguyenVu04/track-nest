package project.tracknest.usertracking.controller;

import com.google.rpc.Code;
import com.google.rpc.Status;
import io.grpc.stub.ServerCallStreamObserver;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.grpc.server.service.GrpcService;
import project.tracknest.usertracking.domain.tracker.locationcommand.service.LocationCommandService;
import project.tracknest.usertracking.domain.tracker.locationquery.service.LocationQueryService;
import project.tracknest.usertracking.domain.tracker.locationquery.service.LocationStreamObserverRegistry;
import project.tracknest.usertracking.proto.lib.*;

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
    public void streamFamilyMemberLocations(
            StreamFamilyMemberLocationsRequest request,
            StreamObserver<FamilyMemberLocation> responseObserver
    ) {

        UUID userId = getCurrentUserId();

        ServerCallStreamObserver<FamilyMemberLocation> serverObserver =
                (ServerCallStreamObserver<FamilyMemberLocation>) responseObserver;

        serverObserver.disableAutoRequest();

        List<FamilyMemberLocation> lastLocations = queryService.streamFamilyMemberLocations(userId, request);

        for (FamilyMemberLocation location : lastLocations) {
            serverObserver.onNext(location);
        }

        UUID id = registry.register(userId, serverObserver);

        serverObserver.setOnCancelHandler(() -> {
            registry.unregister(id, serverObserver);
            log.info("Client cancelled the stream for userId: {}", userId);
        });
    }

    @Override
    public void listFamilyMemberLocationHistory(
            ListFamilyMemberLocationHistoryRequest request,
            StreamObserver<ListFamilyMemberLocationHistoryResponse> responseObserver
    ) {
        UUID userId = getCurrentUserId();

        ListFamilyMemberLocationHistoryResponse response = queryService
                .listFamilyMemberLocationHistory(userId, request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public StreamObserver<UpdateUserLocationRequest> updateUserLocation(
            StreamObserver<UpdateUserLocationResponse> responseObserver
    ) {
        UUID userId = getCurrentUserId();

        return new StreamObserver<>() {
            @Override
            public void onNext(UpdateUserLocationRequest updateUserLocationRequest) {
                commandService.updateUserLocation(userId, updateUserLocationRequest);
            }

            @Override
            public void onError(Throwable throwable) {
                log.warn("Error receiving location update from userId {}: {}", userId, throwable.getMessage());
            }

            @Override
            public void onCompleted() {
                UpdateUserLocationResponse response = UpdateUserLocationResponse
                        .newBuilder()
                        .setStatus(Status
                                .newBuilder()
                                .setCode(Code.OK_VALUE)
                                .setMessage("Location updates completed successfully")
                                .build())
                        .build();
                responseObserver.onNext(response);
                responseObserver.onCompleted();
                log.info("Completed receiving location updates from userId {}", userId);
            }
        };
    }
}
