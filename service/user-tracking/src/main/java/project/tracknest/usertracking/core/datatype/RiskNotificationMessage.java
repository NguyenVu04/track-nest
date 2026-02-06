package project.tracknest.usertracking.core.datatype;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Builder;

import java.util.UUID;

@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public record RiskNotificationMessage(
        UUID userId,
        String title,
        String content,
        String type
) {}
