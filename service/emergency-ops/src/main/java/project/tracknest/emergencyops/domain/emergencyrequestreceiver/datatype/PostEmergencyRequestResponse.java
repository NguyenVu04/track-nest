package project.tracknest.emergencyops.domain.emergencyrequestreceiver.datatype;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PostEmergencyRequestResponse(
        Integer statusCode,
        Long createdAtMs
) {}
