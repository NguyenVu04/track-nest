package project.tracknest.usertracking.controller;

import com.google.protobuf.Empty;
import com.google.protobuf.StringValue;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.grpc.server.service.GrpcService;
import project.tracknest.usertracking.domain.notifier.NotifierService;
import project.tracknest.usertracking.proto.lib.MobileDeviceRequest;
import project.tracknest.usertracking.proto.lib.NotifierControllerGrpc;
import project.tracknest.usertracking.proto.lib.RiskNotificationResponse;
import project.tracknest.usertracking.proto.lib.TrackingNotificationResponse;

@GrpcService
@Slf4j
@RequiredArgsConstructor
public class NotifierController extends NotifierControllerGrpc.NotifierControllerImplBase {
    private final NotifierService service;

    @Override
    public void postMobileDevice(MobileDeviceRequest request, StreamObserver<StringValue> responseObserver) {
        log.info("postMobileDevice request: {}", request);
        // TODO: call service to create/update mobile device and return id or result
        responseObserver.onError(Status.UNIMPLEMENTED.withDescription("postMobileDevice not implemented").asRuntimeException());
    }

    @Override
    public void deleteMobileDevice(StringValue request, StreamObserver<Empty> responseObserver) {
        log.info("deleteMobileDevice request: {}", request);
        // TODO: call service to delete mobile device
        responseObserver.onError(Status.UNIMPLEMENTED.withDescription("deleteMobileDevice not implemented").asRuntimeException());
    }

    @Override
    public void getTrackingNotifications(Empty request, StreamObserver<TrackingNotificationResponse> responseObserver) {
        log.info("getTrackingNotifications called");
        // TODO: stream notifications using responseObserver.onNext(...)
        responseObserver.onCompleted();
    }

    @Override
    public void getRiskNotifications(Empty request, StreamObserver<RiskNotificationResponse> responseObserver) {
        log.info("getRiskNotifications called");
        // TODO: stream notifications using responseObserver.onNext(...)
        responseObserver.onCompleted();
    }

    @Override
    public void deleteTrackingNotification(StringValue request, StreamObserver<Empty> responseObserver) {
        log.info("deleteTrackingNotification request: {}", request);
        // TODO: call service to delete a single tracking notification
        responseObserver.onError(Status.UNIMPLEMENTED.withDescription("deleteTrackingNotification not implemented").asRuntimeException());
    }

    @Override
    public void deleteRiskNotification(StringValue request, StreamObserver<Empty> responseObserver) {
        log.info("deleteRiskNotification request: {}", request);
        // TODO: call service to delete a single risk notification
        responseObserver.onError(Status.UNIMPLEMENTED.withDescription("deleteRiskNotification not implemented").asRuntimeException());
    }

    @Override
    public StreamObserver<StringValue> deleteTrackingNotifications(StreamObserver<Empty> responseObserver) {
        log.info("deleteTrackingNotifications stream started");
        return new StreamObserver<StringValue>() {
            @Override
            public void onNext(StringValue value) {
                log.debug("deleteTrackingNotifications onNext: {}", value);
                // TODO: collect ids or call service per id
            }

            @Override
            public void onError(Throwable t) {
                log.warn("deleteTrackingNotifications stream error", t);
                responseObserver.onError(t);
            }

            @Override
            public void onCompleted() {
                log.info("deleteTrackingNotifications stream completed");
                // TODO: perform deletions and respond
                responseObserver.onError(Status.UNIMPLEMENTED.withDescription("deleteTrackingNotifications not implemented").asRuntimeException());
            }
        };
    }

    @Override
    public StreamObserver<StringValue> deleteRiskNotifications(StreamObserver<Empty> responseObserver) {
        log.info("deleteRiskNotifications stream started");
        return new StreamObserver<StringValue>() {
            @Override
            public void onNext(StringValue value) {
                log.debug("deleteRiskNotifications onNext: {}", value);
                // TODO: collect ids or call service per id
            }

            @Override
            public void onError(Throwable t) {
                log.warn("deleteRiskNotifications stream error", t);
                responseObserver.onError(t);
            }

            @Override
            public void onCompleted() {
                log.info("deleteRiskNotifications stream completed");
                // TODO: perform deletions and respond
                responseObserver.onError(Status.UNIMPLEMENTED.withDescription("deleteRiskNotifications not implemented").asRuntimeException());
            }
        };
    }

    @Override
    public void deleteAllTrackingNotifications(Empty request, StreamObserver<Empty> responseObserver) {
        log.info("deleteAllTrackingNotifications called");
        // TODO: call service to delete all tracking notifications
        responseObserver.onError(Status.UNIMPLEMENTED.withDescription("deleteAllTrackingNotifications not implemented").asRuntimeException());
    }

    @Override
    public void deleteAllRiskNotifications(Empty request, StreamObserver<Empty> responseObserver) {
        log.info("deleteAllRiskNotifications called");
        // TODO: call service to delete all risk notifications
        responseObserver.onError(Status.UNIMPLEMENTED.withDescription("deleteAllRiskNotifications not implemented").asRuntimeException());
    }
}
