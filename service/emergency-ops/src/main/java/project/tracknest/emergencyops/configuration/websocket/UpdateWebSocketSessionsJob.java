package project.tracknest.emergencyops.configuration.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.springframework.messaging.simp.user.SimpSession;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Component;
import project.tracknest.emergencyops.configuration.common.ServerIdProvider;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class UpdateWebSocketSessionsJob implements Job {
    private final WebSocketSessionService sessionService;
    private final ServerIdProvider serverIdProvider;
    private final SimpUserRegistry simpUserRegistry;

    @Override
    public void execute(JobExecutionContext context) {
        Set<String> sessionIds = simpUserRegistry.getUsers().stream()
                .flatMap(user -> user.getSessions().stream())
                .map(SimpSession::getId)
                .collect(Collectors.toSet());

        for (String sessionId : sessionIds) {
            try {
                WebSocketSession session = sessionService.getSession(UUID.fromString(sessionId));
                session.serverIds().add(serverIdProvider.getServerId());
                sessionService.updateSession(session);
            } catch (Exception e) {
                log.error("Failed to update WebSocket session {}: {}", sessionId, e.getMessage());
            }
        }

        log.info("Updated WebSocket sessions for {} connected users on server {}",
                sessionIds.size(), serverIdProvider.getServerId());
    }
}
