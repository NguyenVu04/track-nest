package project.tracknest.criminalreports.core.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Builder;

import java.util.UUID;

@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public record ReportNotificationMessage(
        String eventType,   // "CREATED" | "PUBLISHED" | "DELETED"
        UUID reportId,
        String title,
        String reportType   // "missing-person" | "crime" | "guideline"
) {}
