package project.tracknest.criminalreports.configuration.messagequeue;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaMessageProducerImpl<T> implements MessageProducer<T> {
    private final KafkaTemplate<String, T> kafkaTemplate;

    @Override
    public void produce(String topic, T message) {
        kafkaTemplate.send(topic, message).whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to send message to topic {}: {}", topic, ex.getMessage());
            } else {
                log.info("Message sent to topic {} successfully", topic);
            }
        });
    }
}
