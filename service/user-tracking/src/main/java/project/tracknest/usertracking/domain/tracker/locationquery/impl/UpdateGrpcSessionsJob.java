package project.tracknest.usertracking.domain.tracker.locationquery.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.stereotype.Component;
import project.tracknest.usertracking.configuration.common.ServerIdProvider;
import project.tracknest.usertracking.configuration.redis.GrpcSession;
import project.tracknest.usertracking.configuration.redis.GrpcSessionService;
import project.tracknest.usertracking.domain.tracker.locationquery.service.LocationStreamObserverRegistry;

import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class UpdateGrpcSessionsJob implements Job {
    private final GrpcSessionService grpcSessionService;
    private final ServerIdProvider serverIdProvider;
    private final LocationStreamObserverRegistry registry;

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        List<UUID> userIds = registry.listConnectedUsers();

        for (UUID userId : userIds) {
            GrpcSession session = grpcSessionService.getSession(userId);
            session.serverIds().add(serverIdProvider.getServerId());
            grpcSessionService.updateSession(session);
        }

        log.info("Updated gRPC sessions for {} connected users on server {}",
                userIds.size(), serverIdProvider.getServerId());
    }
}
