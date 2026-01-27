package project.tracknest.usertracking.core.datatype;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Builder;

import java.util.UUID;

@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public record LocationMessage (
        UUID userId,
        String username,
        String avatarUrl,
        double latitudeDeg,
        double longitudeDeg,
        long timestampMs,
        float accuracyMeter,
        float velocityMps) {
}
