package project.tracknest.usertracking.configuration.redis;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.Set;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GrpcSession(
        UUID sessionId,
        Set<String> serverIds
) {}
