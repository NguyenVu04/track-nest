package project.tracknest.usertracking.configuration.datatype;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record WebSocketTextMessage (String topic, WebSocketMessageType type, Object content) {
}
