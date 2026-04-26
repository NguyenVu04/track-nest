package project.tracknest.usertracking.domain.tracker.locationcommand.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import project.tracknest.usertracking.core.datatype.LocationMessage;

import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
class LocationMessageProducerImpl implements LocationMessageProducer {

    @Value("${app.kafka.topics.location-updated}")
    private String TOPIC;

    private final KafkaTemplate<String, LocationMessage> kafkaTemplate;

    @Override
    public void produce(LocationMessage message) {
        CompletableFuture<?> future = kafkaTemplate.send(TOPIC, message);
        future.whenComplete((_, ex) -> {
            if (ex != null) {
                log.error("Failed to send location message: {}", ex.getMessage());
            } else {
                log.info("Location message of user {} sent successfully", message.userId());
            }
        });
    }
}
