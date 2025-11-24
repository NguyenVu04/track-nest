package project.tracknest.usertracking.controller;

import com.google.protobuf.Empty;
import io.grpc.stub.StreamObserver;
import org.springframework.grpc.server.service.GrpcService;
import project.tracknest.usertracking.proto.lib.LocationRequest;
import project.tracknest.usertracking.proto.lib.TrackerControllerGrpc;

@GrpcService
public class TrackerController extends TrackerControllerGrpc.TrackerControllerImplBase {
    @Override
    public StreamObserver<LocationRequest> postLocation(StreamObserver<Empty> responseObserver) {
        return new StreamObserver<LocationRequest>() {
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
                // client finished streaming — reply with an empty response
                responseObserver.onNext(Empty.getDefaultInstance());
                responseObserver.onCompleted();
            }
        };
    }
}
