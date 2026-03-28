package project.tracknest.usertracking.domain.notifier.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import project.tracknest.usertracking.core.datatype.NotificationSentMessage;

import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
class NotificationSentMessageProducerImpl implements NotificationSentMessageProducer {
    @Value("${app.kafka.topics[1]}")
    private String TOPIC;

    private final KafkaTemplate<String, NotificationSentMessage> kafkaTemplate;

    @Override
    public void produce(NotificationSentMessage message) {
        CompletableFuture<?> future = kafkaTemplate.send(TOPIC, message);
        future.whenComplete((_, ex) -> {
            if (ex != null) {
                log.error("Failed to send Notification Sent Message: {}", ex.getMessage());
            } else {
                log.info("Notification Sent Message sent successfully");
            }
        });
    }
}
