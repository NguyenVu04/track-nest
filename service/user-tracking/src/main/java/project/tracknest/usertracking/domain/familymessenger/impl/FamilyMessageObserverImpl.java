package project.tracknest.usertracking.domain.familymessenger.impl;

import io.grpc.stub.StreamObserver;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import project.tracknest.usertracking.configuration.common.ServerIdProvider;
import project.tracknest.usertracking.configuration.redis.GrpcSession;
import project.tracknest.usertracking.configuration.redis.GrpcSessionService;
import project.tracknest.usertracking.core.datatype.FamilyMessageEvent;
import project.tracknest.usertracking.domain.familymessenger.service.FamilyMessengerStreamRegistry;
import project.tracknest.usertracking.proto.lib.Message;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
class FamilyMessageObserverImpl implements FamilyMessageObserver, FamilyMessengerStreamRegistry {
    private static final String SEP = ":";

    private final GrpcSessionService grpcSessionService;
    private final ServerIdProvider serverIdProvider;
    private final FamilyMessengerFamilyCircleMemberRepository memberRepository;
    private final ConcurrentHashMap<String, Set<StreamObserver<Message>>> observers;

    FamilyMessageObserverImpl(
            GrpcSessionService grpcSessionService,
            ServerIdProvider serverIdProvider,
            FamilyMessengerFamilyCircleMemberRepository memberRepository
    ) {
        this.grpcSessionService = grpcSessionService;
        this.serverIdProvider = serverIdProvider;
        this.memberRepository = memberRepository;
        this.observers = new ConcurrentHashMap<>();
    }

    @Override
    public void deliverToUser(UUID userId, FamilyMessageEvent event) {
        String sessionKey = buildSessionKey(userId, UUID.fromString(event.getFamilyCircleId()));

        observers.computeIfPresent(sessionKey, (_, sessionObservers) -> {
            Message message = toProtoMessage(event);
            List<StreamObserver<Message>> failed = new ArrayList<>();

            for (StreamObserver<Message> observer : sessionObservers) {
                try {
                    observer.onNext(message);
                } catch (Exception e) {
                    log.warn("Failed to deliver to observer for session {}: {}", sessionKey, e.getMessage());
                    failed.add(observer);
                }
            }

            failed.forEach(obs -> unregister(sessionKey, obs));
            return sessionObservers;
        });
    }

    @Override
    public String register(UUID userId, UUID circleId, StreamObserver<Message> observer) {
        if (memberRepository.findById_FamilyCircleIdAndId_MemberId(circleId, userId).isEmpty()) {
            log.warn("User {} attempted to subscribe to circle {} without membership", userId, circleId);
            throw new IllegalArgumentException("User is not a member of the specified family circle");
        }

        String sessionKey = buildSessionKey(userId, circleId);
        observers.computeIfAbsent(sessionKey, _ -> ConcurrentHashMap.newKeySet()).add(observer);

        GrpcSession session = grpcSessionService.getSession(userId);
        session.serverIds().add(serverIdProvider.getServerId());
        grpcSessionService.updateSession(session);

        log.info("Registered family message stream for userId={} circleId={}", userId, circleId);
        return sessionKey;
    }

    @Override
    public void unregister(String sessionKey, StreamObserver<Message> observer) {
        observers.computeIfPresent(sessionKey, (_, set) -> {
            set.remove(observer);
            return set.isEmpty() ? null : set;
        });
        log.info("Unregistered family message stream for sessionKey={}", sessionKey);
    }

    private String buildSessionKey(UUID userId, UUID circleId) {
        return userId + SEP + circleId;
    }

    private Message toProtoMessage(FamilyMessageEvent event) {
        return Message.newBuilder()
                .setMessageId(event.getMessageId())
                .setSenderId(event.getSenderId())
                .setMessageContent(event.getContent())
                .setSentAtMs(event.getSentAtMs())
                .build();
    }
}
