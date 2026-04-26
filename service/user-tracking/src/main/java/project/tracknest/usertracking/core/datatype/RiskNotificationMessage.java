package project.tracknest.usertracking.core.datatype;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Builder;

import java.util.Map;
import java.util.UUID;

@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public record RiskNotificationMessage(
        UUID userId,
        String title,
        String content,
        String type
) {
    public static RiskNotificationMessage from(Map<String, Object> map) {
        return RiskNotificationMessage.builder()
                .userId(UUID.fromString((String) map.get("userId")))
                .title((String) map.get("title"))
                .content((String) map.get("content"))
                .type((String) map.get("type"))
                .build();
    }
}
