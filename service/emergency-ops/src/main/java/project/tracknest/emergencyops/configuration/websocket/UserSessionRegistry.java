package project.tracknest.emergencyops.configuration.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;
import project.tracknest.emergencyops.configuration.common.ServerIdProvider;

import java.util.*;
import java.util.concurrent.*;

@Slf4j
@Component
@EnableScheduling
public class UserSessionRegistry {
    public static final String REDIS_KEY_PREFIX = "websocket_sessions:";
    public static final int REDIS_SESSION_EXPIRATION_MINUTES = 3;
    private final ExecutorService executorService;
    private final ConcurrentHashMap<String, Set<WebSocketSessionContainer>> sessions;
    private final StringRedisTemplate redisTemplate;
    private final ServerIdProvider serverIdProvider;

    public UserSessionRegistry(
            StringRedisTemplate redisTemplate,
            ServerIdProvider serverIdProvider,
            ExecutorService executorService) {
        this.executorService = executorService;
        this.sessions = new ConcurrentHashMap<>();
        this.redisTemplate = redisTemplate;
        this.serverIdProvider = serverIdProvider;
    }

    @Scheduled(fixedRate = 2, timeUnit = TimeUnit.MINUTES)
    public void refreshRedisWebSocketSessions() {
        log.info("Refreshing websocket sessions.");

        SetOperations<String, String> ops = redisTemplate.opsForSet();
        List<String> userIds = new ArrayList<>(sessions.keySet());
        if (userIds.isEmpty()) return;

        List<Future<?>> futures = new ArrayList<>();
        for (String userId : userIds) {
            futures.add(executorService.submit(() -> {
                try {
                    String key = REDIS_KEY_PREFIX + userId;
                    String value = serverIdProvider.getServerId();
                    ops.add(key, value);
                    redisTemplate.expire(key, REDIS_SESSION_EXPIRATION_MINUTES, TimeUnit.MINUTES);
                } catch (Exception e) {
                    log.error("Failed to refresh Redis WebSocket session for user {}:", userId, e);
                }
            }));
        }

        for (Future<?> future : futures) {
            try {
                future.get(1, TimeUnit.MINUTES);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                log.error("Interrupted while waiting for refresh tasks", ie);
            } catch (ExecutionException ee) {
                log.error("Error in refresh task", ee.getCause());
            } catch (TimeoutException te) {
                log.warn("Timeout waiting for refresh task", te);
            }
        }
    }

    public void register(String userId, WebSocketSession session) {
        sessions.computeIfAbsent(userId, _ -> ConcurrentHashMap.newKeySet())
                .add(new WebSocketSessionContainer(session, new HashSet<>()));

        SetOperations<String, String> ops = redisTemplate.opsForSet();

        String key = REDIS_KEY_PREFIX + userId;
        String value = serverIdProvider.getServerId();
        ops.add(key, value);
        redisTemplate.expire(key, REDIS_SESSION_EXPIRATION_MINUTES, TimeUnit.MINUTES);
    }

    public void unregister(String userId, WebSocketSession session) {
        if (session == null) return;

        sessions.computeIfPresent(userId, (_, set) -> {
            set.removeIf(container ->
                    container.getId().equals(session.getId()));

            return set.isEmpty() ? null : set;
        });

        SetOperations<String, String> ops = redisTemplate.opsForSet();

        String key = REDIS_KEY_PREFIX + userId;
        String value = serverIdProvider.getServerId();
        ops.remove(key, value);
    }

    public void subscribe(String userId, WebSocketSession session, String topic) {
        if (session == null) return;
        sessions.computeIfPresent(userId, (_, set) -> {
            for (WebSocketSessionContainer container : set) {
                if (container.getId().equals(session.getId())) {
                    container.addTopic(topic);
                    break;
                }
            }
            return set;
        });
    }

    public void unsubscribe(String userId, WebSocketSession session, String topic) {
        if (session == null) return;
        sessions.computeIfPresent(userId, (_, set) -> {
            for (WebSocketSessionContainer container : set) {
                if (container.getId().equals(session.getId())) {
                    container.removeTopic(topic);
                    break;
                }
            }
            return set;
        });
    }

    public Set<WebSocketSessionContainer> getSessions(String userId) {
        Set<WebSocketSessionContainer> set = sessions.get(userId);
        if (set == null || set.isEmpty()) return Collections.emptySet();
        return Set.copyOf(set);
    }

    public void removeClosedSessions(String userId) {
        sessions.computeIfPresent(userId, (_, set) -> {
            set.removeIf(WebSocketSessionContainer::isClose);
            return set.isEmpty() ? null : set;
        });
    }
}
