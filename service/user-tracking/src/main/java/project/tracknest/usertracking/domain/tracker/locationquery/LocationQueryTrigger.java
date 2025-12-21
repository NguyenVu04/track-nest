package project.tracknest.usertracking.domain.tracker.locationquery;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import project.tracknest.usertracking.core.datatype.LocationMessage;

@Service
@Slf4j
public class LocationQueryTrigger {
    private final LocationMessageConsumer service;

    public LocationQueryTrigger(LocationMessageConsumer service) {
        this.service = service;
    }

    @KafkaListener(topics = "${app.kafka.topics[0]}")
    private void consumeLocationMessage(LocationMessage message) {
        service.trackTaget(message);
    }
}
