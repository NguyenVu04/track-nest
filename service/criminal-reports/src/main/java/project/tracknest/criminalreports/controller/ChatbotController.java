package project.tracknest.criminalreports.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.tracknest.criminalreports.domain.chatbot.impl.datatype.request.PostMessageRequest;
import project.tracknest.criminalreports.domain.chatbot.impl.datatype.request.PostSessionRequest;
import project.tracknest.criminalreports.domain.chatbot.impl.datatype.response.GetSessionResponse;
import project.tracknest.criminalreports.domain.chatbot.impl.datatype.response.PostMesssgeResponse;
import project.tracknest.criminalreports.domain.chatbot.impl.datatype.response.PostSessionResponse;
import project.tracknest.criminalreports.domain.chatbot.service.ChatbotService;

import java.util.UUID;

import static project.tracknest.criminalreports.configuration.security.SecurityUtils.getCurrentUserId;

@RestController
@RequestMapping("/chatbot")
@RequiredArgsConstructor
public class ChatbotController {
    private final ChatbotService service;

    @PostMapping("/session")
    public ResponseEntity<PostSessionResponse> startChatbotSession(
            @Valid
            @RequestBody
            PostSessionRequest request
    ) {
        UUID userId = getCurrentUserId();

        PostSessionResponse response = service.startChatbotSession(userId, request);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/message")
    public ResponseEntity<PostMesssgeResponse> sendMessage(
            @Valid
            @RequestBody
            PostMessageRequest request
    ) {
        UUID userId = getCurrentUserId();

        PostMesssgeResponse response = service.sendMessage(userId, request);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<GetSessionResponse> retrieveSession(
            @PathVariable UUID sessionId
    ) {
        UUID userId = getCurrentUserId();

        GetSessionResponse response = service.retrieveSession(userId, sessionId);

        return ResponseEntity.ok(response);
    }
}
