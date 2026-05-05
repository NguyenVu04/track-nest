package project.tracknest.emergencyops.domain.emergencyadmin.impl.datatype;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

import java.util.UUID;

@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record GetAllEmergencyRequestsResponse(
        UUID id,
        Long openAt,
        Long closeAt,
        UUID senderId,
        UUID targetId,
        UUID emergencyServiceId,
        String statusName,
        double longitude,
        double latitude
) {}
