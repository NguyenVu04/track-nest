package project.tracknest.usertracking.domain.familymessenger.service;

import io.grpc.stub.StreamObserver;
import project.tracknest.usertracking.proto.lib.Message;

import java.util.UUID;

public interface FamilyMessengerStreamRegistry {
    String register(UUID userId, UUID circleId, StreamObserver<Message> observer);
    void unregister(String sessionKey, StreamObserver<Message> observer);
}
