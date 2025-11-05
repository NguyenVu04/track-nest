package project.tracknest.usertracking.configuration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import project.tracknest.usertracking.configuration.datatype.WebSocketTextMessage;

import java.security.Principal;

@Slf4j
@Component
public class UserWebSocketHandler extends TextWebSocketHandler {
    private final UserSessionRegistry userSessionRegistry;
    private final ObjectMapper MAPPER = new ObjectMapper();

    public UserWebSocketHandler(UserSessionRegistry userSessionRegistry) {
        this.userSessionRegistry = userSessionRegistry;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Principal principal = session.getPrincipal();

        if (principal == null) {
            log.error("WebSocket connection established without a principal.");
            try {
                session.close(CloseStatus.SESSION_NOT_RELIABLE);
            } catch (Exception e) {
                log.error("Error closing WebSocket session without principal after connection established: {}", e.getMessage());
            }
            return;
        }

        userSessionRegistry.register(principal.getName(), session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        log.debug("WebSocket connection closed with session: {}", session.getId());

        Principal principal = session.getPrincipal();

        if (principal == null) {
            log.error("WebSocket connection closed without a principal.");
            return;
        }

        userSessionRegistry.unregister(principal.getName(), session);
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) {
        Principal principal = session.getPrincipal();

        if (principal == null) {
            log.error("Received WebSocket message without a principal.");

            try {
                session.close(CloseStatus.SESSION_NOT_RELIABLE);
            } catch (Exception e) {
                log.error("Error closing WebSocket session without principal while handling text message: {}", e.getMessage());
            }

            return;
        }

        String payload = message.getPayload();
        log.info("Received WebSocket message: {}", payload);
        try {
            JsonNode jsonNode = MAPPER.readTree(payload);

            WebSocketTextMessage textMessage = MAPPER.convertValue(jsonNode, WebSocketTextMessage.class);

            switch (textMessage.type()) {
                case SUBSCRIBE -> {
                    log.info("Handling subscription to topic: {}", textMessage.topic());
                    userSessionRegistry.subscribe(principal.getName(), session, textMessage.topic());
                }
                case UNSUBSCRIBE -> {
                    log.info("Handling unsubscription from topic: {}", textMessage.topic());
                    userSessionRegistry.unsubscribe(principal.getName(), session, textMessage.topic());
                }
                case MESSAGE -> log.warn("Receive message for topic {} from: {}", textMessage.topic(), principal.getName());
                default -> log.warn("Unknown WebSocket message type: {}", textMessage.type());
            }

        } catch (Exception e) {
            log.error("Error handling WebSocket message: {}", e.getMessage());
        }
    }
}
