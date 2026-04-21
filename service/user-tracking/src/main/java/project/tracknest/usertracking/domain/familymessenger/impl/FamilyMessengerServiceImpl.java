package project.tracknest.usertracking.domain.familymessenger.impl;

import com.google.rpc.Code;
import com.google.rpc.Status;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.usertracking.configuration.redis.ServerRedisMessage;
import project.tracknest.usertracking.configuration.redis.ServerRedisMessagePublisher;
import project.tracknest.usertracking.core.datatype.FamilyMessageEvent;
import project.tracknest.usertracking.core.datatype.PageToken;
import project.tracknest.usertracking.core.entity.FamilyCircleMember;
import project.tracknest.usertracking.core.entity.FamilyMessage;
import project.tracknest.usertracking.core.utils.PageTokenCodec;
import project.tracknest.usertracking.domain.familymessenger.service.FamilyMessengerEventSubscriber;
import project.tracknest.usertracking.domain.familymessenger.service.FamilyMessengerService;
import project.tracknest.usertracking.proto.lib.*;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import static project.tracknest.usertracking.configuration.security.SecurityUtils.getCurrentUserId;

@Service
@Slf4j
@RequiredArgsConstructor
class FamilyMessengerServiceImpl implements FamilyMessengerService, FamilyMessengerEventSubscriber {
    private final FamilyMessengerFamilyMessageRepository messageRepository;
    private final FamilyMessengerFamilyCircleMemberRepository memberRepository;
    private final ServerRedisMessagePublisher redisPublisher;
    private final FamilyMessageObserver observer;

    @Override
    @Transactional
    public SendMessageResponse sendFamilyMessage(SendMessageRequest request) {
        UUID userId = getCurrentUserId();
        UUID circleId = UUID.fromString(request.getFamilyCircleId());

        if (memberRepository.findById_FamilyCircleIdAndId_MemberId(circleId, userId).isEmpty()) {
            log.warn("User {} is not a member of circle {} when sending family message", userId, circleId);
            return SendMessageResponse.newBuilder()
                    .setStatus(Status.newBuilder()
                            .setCode(Code.PERMISSION_DENIED_VALUE)
                            .setMessage("User is not a member of this family circle")
                            .build())
                    .build();
        }

        long nowMs = System.currentTimeMillis();
        FamilyMessage saved = messageRepository.save(FamilyMessage.builder()
                .familyCircleId(circleId)
                .senderId(userId)
                .content(request.getMessageContent())
                .build());

        FamilyMessageEvent event = FamilyMessageEvent.builder()
                .messageId(saved.getId().toString())
                .familyCircleId(circleId.toString())
                .senderId(userId.toString())
                .content(saved.getContent())
                .sentAtMs(nowMs)
                .build();

        publishToCircleMembers(circleId, event);

        return SendMessageResponse.newBuilder()
                .setMessageId(saved.getId().toString())
                .setSentAtMs(nowMs)
                .setStatus(Status.newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Message sent successfully")
                        .build())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ListMessagesResponse listFamilyMessages(ListMessagesRequest request) {
        UUID userId = getCurrentUserId();
        UUID circleId = UUID.fromString(request.getFamilyCircleId());

        if (memberRepository.findById_FamilyCircleIdAndId_MemberId(circleId, userId).isEmpty()) {
            log.warn("User {} is not a member of circle {} when listing family messages", userId, circleId);
            return ListMessagesResponse.newBuilder()
                    .setStatus(Status.newBuilder()
                            .setCode(Code.PERMISSION_DENIED_VALUE)
                            .setMessage("User is not a member of this family circle")
                            .build())
                    .build();
        }

        int pageSize = request.getPageSize() > 0 ? request.getPageSize() : 20;
        String pageTokenStr = request.getPageToken();
        PageRequest pageable = PageRequest.of(0, pageSize);

        Slice<FamilyMessage> slice;
        if (pageTokenStr.isBlank()) {
            slice = messageRepository.findFirstPageByFamilyCircleId(circleId, pageable);
        } else {
            PageToken cursor = PageTokenCodec.decode(pageTokenStr);
            OffsetDateTime lastCreatedAt = OffsetDateTime.ofInstant(
                    Instant.ofEpochMilli(cursor.lastCreatedAtMs()), ZoneOffset.UTC);
            UUID lastId = UUID.fromString(cursor.lastId());
            slice = messageRepository.findNextPageByFamilyCircleId(circleId, lastCreatedAt, lastId, pageable);
        }

        List<project.tracknest.usertracking.proto.lib.Message> messages = slice.getContent().stream()
                .map(fm -> project.tracknest.usertracking.proto.lib.Message.newBuilder()
                        .setMessageId(fm.getId().toString())
                        .setSenderId(fm.getSenderId().toString())
                        .setMessageContent(fm.getContent())
                        .setSentAtMs(fm.getCreatedAt().toInstant().toEpochMilli())
                        .build())
                .toList();

        ListMessagesResponse.Builder builder = ListMessagesResponse.newBuilder()
                .addAllMessages(messages)
                .setStatus(Status.newBuilder()
                        .setCode(Code.OK_VALUE)
                        .setMessage("Messages retrieved successfully")
                        .build());

        if (slice.hasNext() && !slice.getContent().isEmpty()) {
            FamilyMessage last = slice.getContent().getLast();
            PageToken nextToken = new PageToken(
                    last.getCreatedAt().toInstant().toEpochMilli(),
                    last.getId().toString()
            );
            builder.setNextPageToken(PageTokenCodec.encode(nextToken));
        }

        return builder.build();
    }

    @Override
    public void receiveFamilyMessageEvent(UUID receiverId, FamilyMessageEvent event) {
        try {
            observer.deliverToUser(receiverId, event);
        } catch (Exception e) {
            log.error("Failed to deliver family message event to user {}: {}", receiverId, e.getMessage(), e);
        }
    }

    private void publishToCircleMembers(UUID circleId, FamilyMessageEvent event) {
        List<FamilyCircleMember> members = memberRepository.findAllById_FamilyCircleId(circleId);
        for (FamilyCircleMember member : members) {
            UUID memberId = member.getId().getMemberId();
            ServerRedisMessage redisMessage = ServerRedisMessage.builder()
                    .method("receiveFamilyMessage")
                    .receiverId(memberId)
                    .payload(event)
                    .build();
            try {
                redisPublisher.publishMessage(redisMessage, memberId, true);
            } catch (Exception e) {
                log.warn("Failed to publish family message to member {}: {}", memberId, e.getMessage());
            }
        }
    }
}
