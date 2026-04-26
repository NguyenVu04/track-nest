package project.tracknest.emergencyops.domain.safezonemanager.impl.datatype;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PutSafeZoneResponse {
        Long updatedAtMs;
        UUID id;
}
