package project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record CloseEmergencyRequestResponse(
        Integer statusCode,
        Long closedAtMs
) {}
