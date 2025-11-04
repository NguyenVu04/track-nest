package project.tracknest.usertracking.domain.tracker.locationquery;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import project.tracknest.usertracking.core.LocationMessage;

@Service
public class LocationQueryTrigger {
    private final LocationMessageConsumer service;
    private final ObjectMapper MAPPER = new ObjectMapper();

    public LocationQueryTrigger(LocationMessageConsumer service) {
        this.service = service;
    }

    @KafkaListener(topics = "${app.kafka.topics[0]}")
    private void consumeLocationMessage(String message) throws JsonProcessingException {
        JsonNode node = MAPPER.readTree(message);
        service.trackTaget(MAPPER.treeToValue(node, LocationMessage.class));
    }
}
