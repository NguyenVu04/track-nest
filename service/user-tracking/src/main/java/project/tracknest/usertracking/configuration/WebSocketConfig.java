package project.tracknest.usertracking.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    public static final String USER_WEBSOCKET_PATH = "/user";

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(new TextWebSocketHandler(), USER_WEBSOCKET_PATH)
                .setAllowedOriginPatterns("*")
                .setHandshakeHandler(new PrincipalHandshakeHandler());
    }
}
