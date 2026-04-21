package project.tracknest.usertracking.domain.familymessenger.service;

import project.tracknest.usertracking.proto.lib.ListMessagesRequest;
import project.tracknest.usertracking.proto.lib.ListMessagesResponse;
import project.tracknest.usertracking.proto.lib.SendMessageRequest;
import project.tracknest.usertracking.proto.lib.SendMessageResponse;

public interface FamilyMessengerService {
    SendMessageResponse sendFamilyMessage(SendMessageRequest request);

    ListMessagesResponse listFamilyMessages(ListMessagesRequest request);
}
