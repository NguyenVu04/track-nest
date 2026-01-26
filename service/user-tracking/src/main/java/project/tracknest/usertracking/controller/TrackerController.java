package project.tracknest.usertracking.controller;

import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.grpc.server.service.GrpcService;
import project.tracknest.usertracking.domain.tracker.locationcommand.LocationCommandService;
import project.tracknest.usertracking.domain.tracker.locationquery.LocationQueryService;
import project.tracknest.usertracking.domain.tracker.locationquery.LocationStreamObserverRegistry;
import project.tracknest.usertracking.proto.lib.*;

@GrpcService
@RequiredArgsConstructor
@Slf4j
public class TrackerController extends TrackerControllerGrpc.TrackerControllerImplBase {
    private final LocationQueryService queryService;
    private final LocationCommandService commandService;
    private final LocationStreamObserverRegistry registry;

    @Override
    public void streamFamilyMemberLocations(StreamFamilyMemberLocationsRequest request, StreamObserver<FamilyMemberLocation> responseObserver) {
        super.streamFamilyMemberLocations(request, responseObserver);
    }

    @Override
    public void listFamilyMemberLocationHistory(ListFamilyMemberLocationHistoryRequest request, StreamObserver<ListFamilyMemberLocationHistoryResponse> responseObserver) {
        super.listFamilyMemberLocationHistory(request, responseObserver);
    }

    @Override
    public void updateUserLocation(UpdateUserLocationRequest request, StreamObserver<UpdateUserLocationResponse> responseObserver) {
        super.updateUserLocation(request, responseObserver);
    }
}
