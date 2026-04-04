package project.tracknest.usertracking.core.datatype;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Builder;

import java.util.Map;
import java.util.UUID;

@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public record NotificationSentMessage (
        String type,
        UUID notificationId,
        long sent_at_ms
) {

    public static NotificationSentMessage from(Map<String, Object> map) {
        return NotificationSentMessage.builder()
                .type((String) map.get("type"))
                .notificationId(UUID.fromString((String) map.get("notificationId")))
                .sent_at_ms(((Number) map.get("sent_at_ms")).longValue())
                .build();
    }

}
