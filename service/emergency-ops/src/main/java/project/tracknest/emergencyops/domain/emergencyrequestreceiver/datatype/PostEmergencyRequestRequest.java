package project.tracknest.emergencyops.domain.emergencyrequestreceiver.datatype;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PostEmergencyRequestRequest(
        UUID trackerId,
        String trackerUsername,
        String trackerPhoneNumber,
        String trackerEmail,
        UUID targetId,
        String targetUsername,
        String targetPhoneNumber,
        String targetEmail
) {}
