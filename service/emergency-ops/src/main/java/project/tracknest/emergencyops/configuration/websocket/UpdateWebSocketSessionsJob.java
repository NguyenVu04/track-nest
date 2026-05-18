package project.tracknest.emergencyops.configuration.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
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
        Set<String> userIds = simpUserRegistry.getUsers().stream()
                .map(user -> user.getName())
                .collect(Collectors.toSet());

        for (String userId : userIds) {
            try {
                WebSocketSession session = sessionService.getSession(UUID.fromString(userId));
                session.serverIds().add(serverIdProvider.getServerId());
                sessionService.updateSession(session);
            } catch (Exception e) {
                log.error("Failed to update WebSocket session for user {}: {}", userId, e.getMessage());
            }
        }

        log.info("Updated WebSocket sessions for {} connected users on server {}",
                sessionIds.size(), serverIdProvider.getServerId());
    }
}
