package project.tracknest.usertracking.configuration;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.security.Principal;

@Component
public class UserWebSocketHandler extends TextWebSocketHandler {
    private final UserSessionRegistry userSessionRegistry;

    public UserWebSocketHandler(UserSessionRegistry userSessionRegistry) {
        this.userSessionRegistry = userSessionRegistry;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Principal principal = session.getPrincipal();
        if (principal != null) {
            userSessionRegistry.register(principal.getName(), session);
        }
    }
}
