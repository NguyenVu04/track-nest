package project.tracknest.usertracking.domain.familymessenger.service;

import project.tracknest.usertracking.proto.lib.ListMessagesRequest;
import project.tracknest.usertracking.proto.lib.ListMessagesResponse;
import project.tracknest.usertracking.proto.lib.SendMessageRequest;
import project.tracknest.usertracking.proto.lib.SendMessageResponse;

import java.util.UUID;

public interface FamilyMessengerService {
    SendMessageResponse sendFamilyMessage(UUID userId, SendMessageRequest request);

    ListMessagesResponse listFamilyMessages(UUID userId, ListMessagesRequest request);

    /**
     * Sends a test FCM push notification to all members of a family circle
     * except the sender, using the same payload shape as a real chat message.
     *
     * @return number of FCM tokens that received the notification successfully,
     *         or -1 if FCM rejected the entire batch
     */
    int sendTestFamilyMessageNotification(UUID circleId, UUID senderId,
                                          String senderName, String content);
}
