package project.tracknest.emergencyops.domain.safezonelocator.impl.datatype;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GetNearestSafeZonesResponse {
    private UUID safeZoneId;
    private String safeZoneName;
    private float latitudeDegrees;
    private float longitudeDegrees;
    private float radiusMeters;
}
