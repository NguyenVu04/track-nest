package project.tracknest.emergencyops.domain.safezonemanager.impl.datatype;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.OffsetDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record GetServiceSafeZonesResponse (
    double latitude,
    double longitude,
    float radius,
    String name,
    OffsetDateTime createdAt
) {}
