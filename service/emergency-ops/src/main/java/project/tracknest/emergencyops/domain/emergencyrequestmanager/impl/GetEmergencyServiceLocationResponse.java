package project.tracknest.emergencyops.domain.emergencyrequestmanager.impl;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record GetEmergencyServiceLocationResponse (
        Double latitude,
        Double longitude,
        Long updatedAtMs
){}
