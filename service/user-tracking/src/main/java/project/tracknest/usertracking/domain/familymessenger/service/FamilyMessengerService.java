package project.tracknest.usertracking.domain.familymessenger.service;

import project.tracknest.usertracking.proto.lib.ListMessagesRequest;
import project.tracknest.usertracking.proto.lib.ListMessagesResponse;
import project.tracknest.usertracking.proto.lib.SendMessageRequest;
import project.tracknest.usertracking.proto.lib.SendMessageResponse;

import java.util.UUID;

public interface FamilyMessengerService {
    SendMessageResponse sendFamilyMessage(UUID userId, SendMessageRequest request);

    ListMessagesResponse listFamilyMessages(UUID userId, ListMessagesRequest request);
}
