package project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Builder;
import lombok.Data;
import org.hibernate.validator.constraints.Range;

@Data
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class PatchEmergencyServiceLocationRequest {
    @Range(min = -90, max = 90, message = "Latitude must be between -90 and 90")
    double latitudeDegrees;
    @Range(min = -180, max = 180, message = "Longitude must be between -180 and 180")
    double longitudeDegrees;
}