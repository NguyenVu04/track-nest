package project.tracknest.usertracking.domain.tracker.locationquery.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import project.tracknest.usertracking.core.datatype.LocationMessage;
import project.tracknest.usertracking.domain.tracker.locationquery.service.LocationMessageConsumer;

@Service
@Slf4j
@RequiredArgsConstructor
class LocationQueryTrigger {
    private final LocationMessageConsumer service;

    @KafkaListener(topics = "${app.kafka.topics[0]}")
    private void consumeLocationMessage(LocationMessage message) {
        service.trackTaget(message);
    }
}
