package project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record CheckEmergencyRequestAllowedResponse(
        boolean allowed,
        String reason,
        long checkedAtMs
) {}
