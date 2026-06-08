package project.tracknest.criminalreports.domain.reporteventpublisher.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import project.tracknest.criminalreports.core.dto.ReportNotificationMessage;
import project.tracknest.criminalreports.domain.reporteventpublisher.service.ReportEventPublisher;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
class ReportEventPublisherImpl implements ReportEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void publish(ReportType type, EventType eventType, UUID reportId, String title) {
        try {
            messagingTemplate.convertAndSend(
                    type.topic(),
                    ReportNotificationMessage.builder()
                            .eventType(eventType.name())
                            .reportId(reportId)
                            .title(title)
                            .reportType(type.wireName())
                            .build());
        } catch (Exception e) {
            // Broadcast failures must not abort the DB transaction; just log.
            log.warn("Failed to broadcast {} {} for {}: {}",
                    type.wireName(), eventType, reportId, e.getMessage());
        }
    }
}
