package project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PostEmergencyRequestResponse(
        Long createdAtMs,
        UUID id
) {}
