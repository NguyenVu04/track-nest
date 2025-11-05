package project.tracknest.usertracking.configuration;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;
import project.tracknest.usertracking.configuration.datatype.WebSocketSessionContainer;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class UserSessionRegistry {
    private final ConcurrentHashMap<String, Set<WebSocketSessionContainer>> sessions;
    private final RedisTemplate<String, Object> redisTemplate;

    public UserSessionRegistry() {
        this.sessions = new ConcurrentHashMap<>();
    }

    public void register(String userId, WebSocketSession session) {
        sessions.computeIfAbsent(userId, _ -> ConcurrentHashMap.newKeySet())
                .add(new WebSocketSessionContainer(session, new HashSet<>()));
    }

    public void unregister(String userId, WebSocketSession session) {
        if (session == null) return;

        sessions.computeIfPresent(userId, (_, set) -> {
            set.removeIf(container ->
                    container.getId().equals(session.getId()));

            return set.isEmpty() ? null : set;
        });
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
