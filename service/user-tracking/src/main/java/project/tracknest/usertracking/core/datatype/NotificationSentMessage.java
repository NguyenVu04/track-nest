package project.tracknest.usertracking.core.datatype;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Builder;

import java.util.UUID;

@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public record NotificationSentMessage (
        String type,
        UUID notificationId,
        long sent_at_ms
) {}
