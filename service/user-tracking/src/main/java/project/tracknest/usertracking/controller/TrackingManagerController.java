package project.tracknest.usertracking.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.grpc.server.service.GrpcService;
import project.tracknest.usertracking.domain.trackingmanager.TrackingManagerService;
import project.tracknest.usertracking.proto.lib.TrackerControllerGrpc;
import project.tracknest.usertracking.proto.lib.TrackingManagerControllerGrpc;

@GrpcService
@RequiredArgsConstructor
@Slf4j
public class TrackingManagerController extends TrackingManagerControllerGrpc.TrackingManagerControllerImplBase {
    private final TrackingManagerService service;
}
