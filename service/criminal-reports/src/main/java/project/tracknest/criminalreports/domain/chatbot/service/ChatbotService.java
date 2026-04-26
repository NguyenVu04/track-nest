package project.tracknest.criminalreports.domain.chatbot.service;

import project.tracknest.criminalreports.domain.chatbot.impl.datatype.request.PostMessageRequest;
import project.tracknest.criminalreports.domain.chatbot.impl.datatype.request.PostSessionRequest;
import project.tracknest.criminalreports.domain.chatbot.impl.datatype.response.GetSessionResponse;
import project.tracknest.criminalreports.domain.chatbot.impl.datatype.response.PostMesssgeResponse;
import project.tracknest.criminalreports.domain.chatbot.impl.datatype.response.PostSessionResponse;

import java.util.UUID;

public interface ChatbotService {
    PostSessionResponse startChatbotSession(UUID userId, PostSessionRequest request);

    PostMesssgeResponse sendMessage(UUID userId, PostMessageRequest request);

    GetSessionResponse retrieveSession(UUID userId, UUID sessionId);
}
