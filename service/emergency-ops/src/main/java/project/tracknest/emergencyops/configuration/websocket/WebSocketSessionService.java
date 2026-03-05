package project.tracknest.emergencyops.configuration.websocket;

import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.UUID;

@Service
public class WebSocketSessionService {
    @Cacheable(value = "websocket-sessions", key = "#sessionId")
    public WebSocketSession getSession(UUID sessionId) {
        return new WebSocketSession(
                sessionId,
                new HashSet<>()
        );
    }

    @CachePut(value = "websocket-sessions", key = "#session.sessionId")
    public WebSocketSession updateSession(WebSocketSession session) {
        return session;
    }
}
