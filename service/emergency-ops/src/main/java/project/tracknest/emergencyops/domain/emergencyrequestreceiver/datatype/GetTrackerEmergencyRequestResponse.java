package project.tracknest.emergencyops.domain.emergencyrequestreceiver.datatype;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record GetTrackerEmergencyRequestResponse(
        UUID requestId,
        UUID serviceId,
        String serviceName,
        Long createdAtMs,
        Long updatedAtMs,
        UUID targetId,
        String targetUsername,
        String targetPhoneNumber,
        String targetEmail,
        String targetAvatarUrl
) {}
