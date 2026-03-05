package project.tracknest.emergencyops.configuration.websocket;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import project.tracknest.emergencyops.configuration.common.ServerIdProvider;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

class RedisHandshakeInterceptor implements HandshakeInterceptor {
    private final WebSocketSessionService sessionService;
    private final ServerIdProvider serverIdProvider;

    public RedisHandshakeInterceptor(
            WebSocketSessionService sessionService,
            ServerIdProvider serverIdProvider
    ) {
        this.sessionService = sessionService;
        this.serverIdProvider = serverIdProvider;
    }

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes
    ) {

        Principal principal = request.getPrincipal();

        if (principal != null) {
            String id = principal.getName();

            WebSocketSession session = sessionService
                    .getSession(UUID.fromString(id));

            session.serverIds().add(serverIdProvider.getServerId());
            sessionService.updateSession(session);
        }

        return true;
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception
    ) {}
}
