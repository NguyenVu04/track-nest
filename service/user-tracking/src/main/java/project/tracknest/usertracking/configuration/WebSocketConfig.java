package project.tracknest.usertracking.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    public static final String DESTINATION_PREFIX = "/topic/";

    @Override
    public void registerStompEndpoints(org.springframework.web.socket.config.annotation.StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/user").withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker(DESTINATION_PREFIX);
    }
}
