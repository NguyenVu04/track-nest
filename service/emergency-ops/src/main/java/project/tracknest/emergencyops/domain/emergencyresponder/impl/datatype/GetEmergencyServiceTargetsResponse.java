package project.tracknest.emergencyops.domain.emergencyresponder.impl.datatype;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record GetEmergencyServiceTargetsResponse(
        UUID id,
        String username,
        String firstName,
        String lastName,
        String email,
        String phoneNumber,
        String avatarUrl,
        double lastLatitudeDegrees,
        double lastLongitudeDegrees,
        long lastUpdateTimeMs
) {}
