package project.tracknest.usertracking.configuration.redis;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Collections;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class GrpcSessionService {
    private static final String SESSION_KEY_PREFIX = "grpc:session:";
    // Slightly longer than the 8-min inactivity window in DisconnectInactiveUsersJob so
    // the job always gets the chance to clean up before the key auto-expires.
    private static final Duration SESSION_TTL = Duration.ofMinutes(15);

    private final StringRedisTemplate redisTemplate;

    public void addServer(UUID userId, String serverId) {
        String key = SESSION_KEY_PREFIX + userId;
        redisTemplate.opsForSet().add(key, serverId);
        redisTemplate.expire(key, SESSION_TTL);
        log.debug("Added server {} to session for userId {}", serverId, userId);
    }

    public void removeServer(UUID userId, String serverId) {
        redisTemplate.opsForSet().remove(SESSION_KEY_PREFIX + userId, serverId);
        log.debug("Removed server {} from session for userId {}", serverId, userId);
    }

    public Set<String> getServerIds(UUID userId) {
        Set<String> members = redisTemplate.opsForSet().members(SESSION_KEY_PREFIX + userId);
        return members != null ? members : Collections.emptySet();
    }
}
