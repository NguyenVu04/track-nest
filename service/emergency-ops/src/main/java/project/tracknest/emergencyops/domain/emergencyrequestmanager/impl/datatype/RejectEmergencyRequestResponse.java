package project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record RejectEmergencyRequestResponse(
        Integer statusCode,
        Long rejectedAtMs
) {}
