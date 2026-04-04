package project.tracknest.usertracking.domain.notifier.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import project.tracknest.usertracking.core.datatype.RiskNotificationMessage;
import project.tracknest.usertracking.core.datatype.TrackingNotificationMessage;

import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
class NotificationTrigger {
    private final NotificationMessageConsumer service;

    @KafkaListener(topics = "${app.kafka.topics[2]}")
    private void consumeTrackingNotificationMessage(Map<String, Object> messageMap) {
        TrackingNotificationMessage message = TrackingNotificationMessage.from(messageMap);
        service.sendTrackingNotification(message);
    }

    @KafkaListener(topics = "${app.kafka.topics[3]}")
    private void consumeRiskNotificationMessage(Map<String, Object> messageMap) {
        RiskNotificationMessage message = RiskNotificationMessage.from(messageMap);
        service.sendRiskNotification(message);
    }
}
