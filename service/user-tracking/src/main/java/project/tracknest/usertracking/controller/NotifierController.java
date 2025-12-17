package project.tracknest.usertracking.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.grpc.server.service.GrpcService;
import project.tracknest.usertracking.domain.notifier.NotifierService;
import project.tracknest.usertracking.proto.lib.NotifierControllerGrpc;

@GrpcService
@Slf4j
@RequiredArgsConstructor
public class NotifierController extends NotifierControllerGrpc.NotifierControllerImplBase {
    private final NotifierService service;
}
