package project.tracknest.usertracking.core.datatype;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Builder;

import java.util.Map;
import java.util.UUID;

@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public record TrackingNotificationMessage(
        UUID targetId,
        String content,
        String title,
        String type
) {

    public static TrackingNotificationMessage from(Map<String, Object> map) {
        return TrackingNotificationMessage.builder()
                .targetId(UUID.fromString((String) map.get("targetId")))
                .content((String) map.get("content"))
                .title((String) map.get("title"))
                .type((String) map.get("type"))
                .build();
    }

}