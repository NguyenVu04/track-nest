package project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record GetTrackerEmergencyRequestsResponse(
        UUID requestId,
        UUID serviceId,
        String serviceName,
        String servicePhoneNumber,
        Long createdAtMs,
        Long closedAtMs,
        UUID targetId,
        String targetUsername,
        String targetPhoneNumber,
        String targetEmail,
        String targetFirstName,
        String targetLastName,
        String targetAvatarUrl,
        String status
) {}
