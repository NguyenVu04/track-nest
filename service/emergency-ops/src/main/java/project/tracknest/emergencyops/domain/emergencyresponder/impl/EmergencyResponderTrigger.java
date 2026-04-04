package project.tracknest.emergencyops.domain.emergencyresponder.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import project.tracknest.emergencyops.core.datatype.LocationMessage;

import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmergencyResponderTrigger {
    private final LocationMessageConsumer consumer;

    @KafkaListener(topics = "${app.kafka.topics[0]}")
    public void consumeLocationMessage(Map<String, Object> messageMap) {
        LocationMessage message = LocationMessage.from(messageMap);
        consumer.trackTaget(message);
    }
}
