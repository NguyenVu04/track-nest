package project.tracknest.emergencyops.domain.safezonemanager.impl.datatype;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.OffsetDateTime;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record GetServiceSafeZonesResponse (
    UUID id,
    double latitude,
    double longitude,
    float radius,
    String name,
    OffsetDateTime createdAt
) {}
