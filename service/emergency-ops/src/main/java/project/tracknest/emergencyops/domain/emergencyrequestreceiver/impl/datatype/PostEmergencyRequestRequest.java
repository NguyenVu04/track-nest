package project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;
import org.hibernate.validator.constraints.Range;

import java.util.UUID;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PostEmergencyRequestRequest {
    private UUID targetId;

    @Range(min = -90, max = 90, message = "Latitude must be between -90 and 90 degrees")
    private double lastLatitudeDegrees;

    @Range(min = -180, max = 180, message = "Longitude must be between -180 and 180 degrees")
    private double lastLongitudeDegrees;
}
