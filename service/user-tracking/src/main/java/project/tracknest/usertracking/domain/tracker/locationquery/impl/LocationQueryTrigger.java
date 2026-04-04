package project.tracknest.usertracking.domain.tracker.locationquery.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import project.tracknest.usertracking.core.datatype.LocationMessage;

import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
class LocationQueryTrigger {
    private final LocationMessageConsumer service;

    @KafkaListener(topics = "${app.kafka.topics[0]}")
    private void consumeLocationMessage(Map<String, Object> messageMap) {
        LocationMessage message = LocationMessage.from(messageMap);
        service.trackTaget(message);
    }
}
