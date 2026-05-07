package project.tracknest.emergencyops.domain.emergencyrequestadmin.impl.datatype;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

import java.util.UUID;

@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record GetEmergencyRequestsResponse(
        UUID id,
        UUID senderId,
        String senderUsername,
        String senderFirstName,
        String senderLastName,
        String senderPhoneNumber,
        String senderEmail,
        String senderAvatarUrl,
        UUID targetId,
        String targetUsername,
        String targetFirstName,
        String targetLastName,
        String targetPhoneNumber,
        String targetEmail,
        String targetAvatarUrl,
        Long openedAt,
        Long closedAt,
        String status,
        double targetLastLatitude,
        double targetLastLongitude,
        UUID serviceId,
        String serviceUsername,
        String servicePhoneNumber,
        String serviceEmail
) {
}
