package project.tracknest.criminalreports.domain.reporteventpublisher.service;

import java.util.UUID;

/**
 * Cross-domain helper for broadcasting report lifecycle events on the STOMP
 * /topic/reports/* destinations. Consumed by every service that creates,
 * publishes, or deletes a report so the dashboard reflects changes in real time.
 */
public interface ReportEventPublisher {

    /** Event types accepted by the frontend ReportRealtimeContext. */
    enum EventType { CREATED, PUBLISHED, DELETED }

    /** Report categories — keep in sync with the frontend TOPIC_MAP. */
    enum ReportType {
        CRIME("crime", "/topic/reports/crime"),
        MISSING_PERSON("missing-person", "/topic/reports/missing-person"),
        GUIDELINE("guideline", "/topic/reports/guideline");

        private final String wireName;
        private final String topic;

        ReportType(String wireName, String topic) {
            this.wireName = wireName;
            this.topic = topic;
        }

        public String wireName() { return wireName; }
        public String topic() { return topic; }
    }

    void publish(ReportType type, EventType eventType, UUID reportId, String title);
}
