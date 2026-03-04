package project.tracknest.emergencyops.domain.safezonemanager.impl.datatype;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PutSafeZoneRequest(
        double latitudeDegrees,
        double longitudeDegrees,
        float radiusMeters,
        String name
) {}
