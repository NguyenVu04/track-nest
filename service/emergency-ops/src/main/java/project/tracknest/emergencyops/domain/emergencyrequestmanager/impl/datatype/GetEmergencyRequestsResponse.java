package project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record GetEmergencyRequestsResponse(
        String Id,
        String senderId,
        String senderUsername,
        String senderFirstName,
        String senderLastName,
        String senderPhoneNumber,
        String senderEmail,
        String targetId,
        String targetUsername,
        String targetFirstName,
        String targetLastName,
        String targetPhoneNumber,
        String targetEmail,
        Long openedAt,
        Long closedAt,
        String status
) {
}
