package project.tracknest.emergencyops.core.datatype;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Builder;

import java.util.UUID;

@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public record TrackingNotificationMessage(
        UUID targetId,
        String content,
        String title,
        String type
) {}