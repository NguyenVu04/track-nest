package project.tracknest.usertracking.controller;

import io.grpc.stub.ServerCallStreamObserver;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.grpc.server.service.GrpcService;
import project.tracknest.usertracking.domain.familymessenger.service.FamilyMessengerService;
import project.tracknest.usertracking.domain.familymessenger.service.FamilyMessengerStreamRegistry;
import project.tracknest.usertracking.proto.lib.*;

import java.util.UUID;

import static project.tracknest.usertracking.configuration.security.SecurityUtils.getCurrentUserId;

@GrpcService
@RequiredArgsConstructor
@Slf4j
public class FamilyMessageController extends FamilyMessengerControllerGrpc.FamilyMessengerControllerImplBase {
    private final FamilyMessengerService service;
    private final FamilyMessengerStreamRegistry registry;

    @Override
    public void sendMessage(SendMessageRequest request, StreamObserver<SendMessageResponse> responseObserver) {
        responseObserver.onNext(service.sendFamilyMessage(request));
        responseObserver.onCompleted();
    }

    @Override
    public void listMessages(ListMessagesRequest request, StreamObserver<ListMessagesResponse> responseObserver) {
        responseObserver.onNext(service.listFamilyMessages(request));
        responseObserver.onCompleted();
    }

    @Override
    public void receiveMessageStream(
            ReceiveMessageStreamRequest request,
            StreamObserver<Message> responseObserver
    ) {
        UUID userId = getCurrentUserId();
        UUID circleId = UUID.fromString(request.getFamilyCircleId());

        ServerCallStreamObserver<Message> serverObserver =
                (ServerCallStreamObserver<Message>) responseObserver;
        serverObserver.disableAutoRequest();

        String sessionKey = registry.register(userId, circleId, serverObserver);

        serverObserver.setOnCancelHandler(() -> {
            registry.unregister(sessionKey, serverObserver);
            log.info("Client cancelled family message stream for userId={}", userId);
        });
    }
}
