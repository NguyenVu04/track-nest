package project.tracknest.usertracking.configuration.redis;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.UUID;

@Service
@Slf4j
public class GrpcSessionService {
    @Cacheable(value = "grpc-sessions", key = "#sessionId")
    public GrpcSession getSession(UUID sessionId) {
        log.info("Creating new gRPC session for sessionId: {}", sessionId);
        return new GrpcSession(
                sessionId,
                new HashSet<>()
        );
    }

    @CachePut(value = "grpc-sessions", key = "#session.sessionId")
    public GrpcSession updateSession(GrpcSession session) {
        log.info("Updating gRPC session for sessionId: {} with serverIds: {}",
                session.sessionId(), session.serverIds());
        return session;
    }
}
