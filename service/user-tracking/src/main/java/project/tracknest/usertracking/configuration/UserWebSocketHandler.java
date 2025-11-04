package project.tracknest.usertracking.configuration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.security.Principal;

@Slf4j
@Component
public class UserWebSocketHandler extends TextWebSocketHandler {
    private final UserSessionRegistry userSessionRegistry;

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
                log.error("Error closing WebSocket session without principal: {}", e.getMessage());
            }
            return;
        }

        userSessionRegistry.register(principal.getName(), session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Principal principal = session.getPrincipal();

        if (principal == null) {
            log.error("WebSocket connection closed without a principal.");
            return;
        }

        userSessionRegistry.unregister(principal.getName(), session);
    }
}
