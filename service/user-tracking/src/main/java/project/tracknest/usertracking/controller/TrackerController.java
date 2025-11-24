package project.tracknest.usertracking.controller;

import com.google.protobuf.Empty;
import com.google.protobuf.StringValue;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import org.springframework.grpc.server.service.GrpcService;
import project.tracknest.usertracking.domain.tracker.locationcommand.LocationCommandService;
import project.tracknest.usertracking.domain.tracker.locationquery.LocationQueryService;
import project.tracknest.usertracking.proto.lib.LocationRequest;
import project.tracknest.usertracking.proto.lib.LocationResponse;
import project.tracknest.usertracking.proto.lib.TrackerControllerGrpc;

@GrpcService
@RequiredArgsConstructor
public class TrackerController extends TrackerControllerGrpc.TrackerControllerImplBase {
    private final LocationQueryService queryService;
    private final LocationCommandService commandService;

    @Override
    public StreamObserver<LocationRequest> postLocation(StreamObserver<Empty> responseObserver) {
        return new StreamObserver<>() {
            @Override
            public void onNext(LocationRequest request) {
                // handle each location received
                double lat = request.getLatitude();
                double lon = request.getLongitude();
                // process/persist the location...
            }

            @Override
            public void onError(Throwable t) {
                // client sent error; log/cleanup
            }

            @Override
            public void onCompleted() {
                responseObserver.onNext(Empty.getDefaultInstance());
                responseObserver.onCompleted();
            }
        };
    }

    @Override
    public void getTargetsLastLocation(Empty request, StreamObserver<LocationResponse> responseObserver) {

    }

    @Override
    public void getTargetLocationHistory(StringValue request, StreamObserver<LocationResponse> responseObserver) {

    }
}
