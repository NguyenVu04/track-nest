package project.tracknest.emergencyops.domain.safezonemanager.impl.datatype;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;
import org.hibernate.validator.constraints.Range;

@Data
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class PostSafeZoneRequest {
    @Range(min = -90, max = 90, message = "Latitude must be between -90 and 90")
    double latitudeDegrees;
    @Range(min = -180, max = 180, message = "Longitude must be between -180 and 180")
    double longitudeDegrees;
    @Size(min = 4, max = 100, message = "Name must be between 4 and 100 characters")
    String name;
    @Min(value = 0, message = "Radius must be non-negative")
    float radiusMeters;
}
