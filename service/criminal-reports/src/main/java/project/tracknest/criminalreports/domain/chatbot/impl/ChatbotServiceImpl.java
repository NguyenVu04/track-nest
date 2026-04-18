package project.tracknest.criminalreports.domain.chatbot.impl;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.HtmlUtils;
import project.tracknest.criminalreports.configuration.objectstorage.MinIOObjectStorageImpl;
import project.tracknest.criminalreports.configuration.objectstorage.ObjectStorage;
import project.tracknest.criminalreports.core.entity.ChatMessage;
import project.tracknest.criminalreports.core.entity.ChatSession;
import project.tracknest.criminalreports.domain.chatbot.impl.datatype.request.PostMessageRequest;
import project.tracknest.criminalreports.domain.chatbot.impl.datatype.request.PostSessionRequest;
import project.tracknest.criminalreports.domain.chatbot.impl.datatype.response.GetSessionResponse;
import project.tracknest.criminalreports.domain.chatbot.impl.datatype.response.PostMesssgeResponse;
import project.tracknest.criminalreports.domain.chatbot.impl.datatype.response.PostSessionResponse;
import project.tracknest.criminalreports.domain.chatbot.impl.datatype.response.SessionMessage;
import project.tracknest.criminalreports.domain.chatbot.service.ChatbotService;
import project.tracknest.criminalreports.domain.repository.ChatMessageRepository;
import project.tracknest.criminalreports.domain.repository.ChatSessionRepository;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
class ChatbotServiceImpl implements ChatbotService {
    private static final String DEFAULT_FILE_NAME = "index.html";
    private static final short MESSAGE_LIMIT = 15;
    private static final String SYSTEM_PROMPT = """
            You are a professional historical assistant.

            Your task is to answer questions strictly based on the provided document content.
            Always prioritize accuracy, factual correctness, and historical context.

            Guidelines:
            - Use only the information explicitly available in the document. Do not speculate or fabricate.
            - If the document lacks sufficient or relevant information, clearly state that you do not have enough information to answer.
            - Match the language, tone, and style of the user's question.
            - Provide structured, clear, and concise explanations using historically appropriate terminology.
            - Include relevant context such as time period, key figures, and significance when available.

            Length constraint:
            - Keep the answer concise and within 100-150 words (or approximately 80-120 tokens).
            - Avoid unnecessary elaboration, repetition, or filler content.

            Refusal rule:
            - If the answer cannot be derived from the document, respond with:
            "I do not have enough information in the provided document to answer this question."

            Do not use external knowledge under any circumstances.
            """;

    private static final Pattern SCRIPT_PATTERN = Pattern.compile("(?is)<script[^>]*>.*?</script>");
    private static final Pattern STYLE_PATTERN = Pattern.compile("(?is)<style[^>]*>.*?</style>");
    private static final Pattern TAG_PATTERN = Pattern.compile("<[^>]+>");
    private static final Pattern WHITESPACE_PATTERN = Pattern.compile("\\s+");

    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;
    private final ChatClient chatbotClient;
    private final ObjectStorage objectStorage;
    private final EntityManager entityManager;

    @Override
    @Transactional
    public PostSessionResponse startChatbotSession(UUID userId, PostSessionRequest request) {
        ensureDocumentExists(request.getDocumentId());

        ChatSession session = ChatSession.builder()
                .userId(userId)
                .documentId(request.getDocumentId())
                .messageLeft(MESSAGE_LIMIT)
                .build();

        ChatSession saved = sessionRepository.saveAndFlush(session);
        entityManager.refresh(saved);

        return PostSessionResponse.builder()
                .sessionId(saved.getId())
                .createdAtMs(saved.getStartedAt().toInstant().toEpochMilli())
                .build();
    }

    @Override
    @Transactional
    public PostMesssgeResponse sendMessage(UUID userId, PostMessageRequest request) {
        ChatSession session = sessionRepository
                .findByIdAndUserIdForUpdate(request.getSessionId(), userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Session with ID " + request.getSessionId() + " not found for user " + userId + "."));

        if (session.getMessageLeft() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Message limit reached for this session.");
        }

        ensureDocumentExists(session.getDocumentId());

        List<ChatMessage> history = messageRepository
                .findBySessionIdOrderByCreatedAtAsc(session.getId());

        List<Message> prompt = buildPrompt(session.getDocumentId(), history, request.getMessage());

        String responseText;
        try {
            responseText = chatbotClient.prompt()
                    .messages(prompt)
                    .call()
                    .content();
        } catch (Exception e) {
            log.error("Failed to generate a response from the model", e);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Failed to generate a response from the model.");
        }

        if (responseText == null || responseText.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Failed to generate a response from the model.");
        }
        String trimmed = responseText.strip();

        session.setMessageLeft((short) (session.getMessageLeft() - 1));

        messageRepository.save(ChatMessage.builder()
                .sessionId(session.getId())
                .role(ChatMessage.ChatMessageRole.USER)
                .content(request.getMessage())
                .build());
        messageRepository.save(ChatMessage.builder()
                .sessionId(session.getId())
                .role(ChatMessage.ChatMessageRole.MODEL)
                .content(trimmed)
                .build());

        return PostMesssgeResponse.builder()
                .response(trimmed)
                .createdAt(System.currentTimeMillis())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public GetSessionResponse retrieveSession(UUID userId, UUID sessionId) {
        ChatSession session = sessionRepository
                .findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Session with ID " + sessionId + " not found for user " + userId + "."));

        List<ChatMessage> messages = messageRepository
                .findBySessionIdOrderByCreatedAtAsc(sessionId);

        return GetSessionResponse.builder()
                .documentId(session.getDocumentId())
                .createdAtMs(session.getStartedAt().toInstant().toEpochMilli())
                .messageLeft(session.getMessageLeft())
                .messages(messages.stream()
                        .map(m -> SessionMessage.builder()
                                .role(m.getRole())
                                .content(m.getContent())
                                .createdAtMs(m.getCreatedAt().toInstant().toEpochMilli())
                                .build())
                        .toList())
                .build();
    }

    private void ensureDocumentExists(UUID documentId) {
        if (!objectStorage.fileExists(MinIOObjectStorageImpl.BUCKET_NAME, objectName(documentId))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Document with ID " + documentId + " does not exist in storage.");
        }
    }

    private List<Message> buildPrompt(UUID documentId, List<ChatMessage> history, String newMessage) {
        String documentContent = stripHtml(readDocument(documentId));

        List<Message> prompt = new ArrayList<>();
        prompt.add(new UserMessage(SYSTEM_PROMPT + "\n\nDocument content:\n" + documentContent));
        for (ChatMessage msg : history) {
            if (msg.getRole() == ChatMessage.ChatMessageRole.MODEL) {
                prompt.add(new AssistantMessage(msg.getContent()));
            } else {
                prompt.add(new UserMessage(msg.getContent()));
            }
        }
        prompt.add(new UserMessage(newMessage));
        return prompt;
    }

    private String readDocument(UUID documentId) {
        try (InputStream in = objectStorage.downloadFile(MinIOObjectStorageImpl.BUCKET_NAME, objectName(documentId))) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.error("Failed to read document {} from storage", documentId, e);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Failed to read document content.");
        }
    }

    private String stripHtml(String html) {
        String noScripts = SCRIPT_PATTERN.matcher(html).replaceAll(" ");
        String noStyles = STYLE_PATTERN.matcher(noScripts).replaceAll(" ");
        String noTags = TAG_PATTERN.matcher(noStyles).replaceAll(" ");
        String unescaped = HtmlUtils.htmlUnescape(noTags);
        return WHITESPACE_PATTERN.matcher(unescaped).replaceAll(" ").trim();
    }

    private String objectName(UUID documentId) {
        return documentId + "/" + DEFAULT_FILE_NAME;
    }
}
