package project.tracknest.criminalreports.domain.chatbot.impl.datatype.response;

import lombok.Builder;
import lombok.Data;
import project.tracknest.criminalreports.core.entity.ChatMessage;

@Data
@Builder
public class SessionMessage {
    ChatMessage.ChatMessageRole role;
    String content;
    long createdAtMs;
}
