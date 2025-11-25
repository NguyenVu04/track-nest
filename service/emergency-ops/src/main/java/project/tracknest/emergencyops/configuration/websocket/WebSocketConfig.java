package project.tracknest.emergencyops.configuration.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {
    private final UserWebSocketHandler userWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        String USER_WEBSOCKET_PATH = "/user";
        registry.addHandler(userWebSocketHandler, USER_WEBSOCKET_PATH)
                .setAllowedOriginPatterns("*")
                .setHandshakeHandler(new PrincipalHandshakeHandler());
    }
}
