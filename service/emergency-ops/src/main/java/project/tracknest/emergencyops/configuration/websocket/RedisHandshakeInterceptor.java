package project.tracknest.emergencyops.configuration.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import project.tracknest.emergencyops.configuration.common.ServerIdProvider;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@Slf4j
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

        // Reject the upgrade when no principal was set by KeycloakFilter.
        // Without this, the handshake succeeded silently and subsequent
        // convertAndSendToUser(...) calls dropped messages because the user
        // was never registered in SimpUserRegistry.
        if (principal == null) {
            log.warn("[WS] rejecting handshake — no authenticated principal (expired or missing JWT?)");
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        String id = principal.getName();

        WebSocketSession session = sessionService
                .getSession(UUID.fromString(id));

        session.serverIds().add(serverIdProvider.getServerId());
        sessionService.updateSession(session);

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
