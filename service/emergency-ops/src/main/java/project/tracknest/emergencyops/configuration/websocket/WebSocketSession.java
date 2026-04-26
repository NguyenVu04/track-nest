package project.tracknest.emergencyops.configuration.websocket;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.Set;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record WebSocketSession(
        UUID sessionId,
        Set<String> serverIds
) {
}
