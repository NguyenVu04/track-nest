package project.tracknest.usertracking.core;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record LocationMessage (
        UUID id,
        UUID userId,
        float latitude,
        float longitude,
        long timestamp,
        float accuracy,
        float velocity) {
}
