package project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DeleteEmergencyRequestResponse(
        Long deletedAtMs,
        UUID id
) {}
