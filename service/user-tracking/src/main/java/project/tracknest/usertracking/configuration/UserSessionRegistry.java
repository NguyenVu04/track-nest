package project.tracknest.usertracking.configuration;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class UserSessionRegistry {
    private final ConcurrentHashMap<String, Set<WebSocketSession>> sessions;

    public UserSessionRegistry() {
        this.sessions = new ConcurrentHashMap<>();
    }

    public void register(String userId, WebSocketSession session) {
        sessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet())
                .add(session);
    }

    public void unregister(String userId, WebSocketSession session) {
        if (session == null) return;
        sessions.computeIfPresent(userId, (k, set) -> {
            set.remove(session);
            return set.isEmpty() ? null : set;
        });
    }

    public Set<WebSocketSession> getSessions(String userId) {
        Set<WebSocketSession> set = sessions.get(userId);
        if (set == null || set.isEmpty()) return Collections.emptySet();
        return Set.copyOf(set);
    }

    public void removeClosedSessions(String userId) {
        sessions.computeIfPresent(userId, (k, set) -> {
            set.removeIf(session -> session == null || !session.isOpen());
            return set.isEmpty() ? null : set;
        });
    }
}
