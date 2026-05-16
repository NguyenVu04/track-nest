package project.tracknest.emergencyops.core.datatype;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record EmergencyStatusMessage(
        String requestId,
        String status,      // "ACCEPTED" | "REJECTED" | "CLOSED"
        Long closedAtMs     // non-null only for CLOSED
) {}
