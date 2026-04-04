package project.tracknest.usertracking.core.datatype;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Builder;

import java.util.Map;
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

    public static LocationMessage from(Map<String, Object> map) {
        return LocationMessage.builder()
                .userId(UUID.fromString((String) map.get("userId")))
                .username((String) map.get("username"))
                .avatarUrl((String) map.get("avatarUrl"))
                .latitudeDeg(((Number) map.get("latitudeDeg")).doubleValue())
                .longitudeDeg(((Number) map.get("longitudeDeg")).doubleValue())
                .timestampMs(((Number) map.get("timestampMs")).longValue())
                .accuracyMeter(((Number) map.get("accuracyMeter")).floatValue())
                .velocityMps(((Number) map.get("velocityMps")).floatValue())
                .build();
    }
}
