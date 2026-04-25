package project.tracknest.usertracking.domain.familymessenger.impl;

import com.google.rpc.Code;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;
import org.springframework.data.domain.PageRequest;
import project.tracknest.usertracking.configuration.redis.ServerRedisMessagePublisher;
import project.tracknest.usertracking.core.datatype.PageToken;
import project.tracknest.usertracking.core.entity.FamilyCircleMember;
import project.tracknest.usertracking.core.entity.FamilyMessage;
import project.tracknest.usertracking.core.utils.PageTokenCodec;
import project.tracknest.usertracking.proto.lib.*;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FamilyMessengerServiceImplTest {

    @Mock FamilyMessengerFamilyMessageRepository messageRepository;
    @Mock FamilyMessengerFamilyCircleMemberRepository memberRepository;
    @Mock ServerRedisMessagePublisher redisPublisher;

    @InjectMocks FamilyMessengerServiceImpl service;

    private static final UUID USER_ID = UUID.fromString("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    private static final UUID CIRCLE_ID = UUID.fromString("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    private static final UUID MSG_ID = UUID.fromString("cccccccc-cccc-4ccc-8ccc-cccccccccccc");
    private static final UUID MEMBER2_ID = UUID.fromString("dddddddd-dddd-4ddd-8ddd-dddddddddddd");

    private FamilyCircleMember buildMember(UUID memberId) {
        return FamilyCircleMember.builder()
                .id(FamilyCircleMember.FamilyCircleMemberId.builder()
                        .familyCircleId(CIRCLE_ID)
                        .memberId(memberId)
                        .build())
                .isAdmin(false)
                .build();
    }

    private FamilyMessage buildMessage() {
        return FamilyMessage.builder()
                .id(MSG_ID)
                .familyCircleId(CIRCLE_ID)
                .senderId(USER_ID)
                .content("Hello from test")
                .createdAt(OffsetDateTime.now(ZoneOffset.UTC))
                .build();
    }

    // ── sendFamilyMessage ─────────────────────────────────────────────────────

    @Nested
    @DisplayName("sendFamilyMessage Tests")
    class SendFamilyMessageTests {

        @Test
        void should_sendMessage_whenUserIsMember() {
            FamilyCircleMember member = buildMember(USER_ID);
            FamilyMessage saved = buildMessage();

            when(memberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.of(member));
            when(messageRepository.save(any(FamilyMessage.class))).thenReturn(saved);
            when(memberRepository.findAllById_FamilyCircleId(CIRCLE_ID))
                    .thenReturn(List.of(member));

            SendMessageRequest req = SendMessageRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .setMessageContent("Hello from test")
                    .build();

            SendMessageResponse res = service.sendFamilyMessage(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            assertEquals(MSG_ID.toString(), res.getMessageId());
            assertTrue(res.getSentAtMs() > 0);
            verify(messageRepository).save(any(FamilyMessage.class));
        }

        @Test
        void should_returnPermissionDenied_whenUserNotMember() {
            when(memberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.empty());

            SendMessageRequest req = SendMessageRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .setMessageContent("Should fail")
                    .build();

            SendMessageResponse res = service.sendFamilyMessage(USER_ID, req);

            assertEquals(Code.PERMISSION_DENIED_VALUE, res.getStatus().getCode());
            verify(messageRepository, never()).save(any());
        }

        @Test
        void should_publishToAllCircleMembers_whenSendSucceeds() {
            FamilyCircleMember member1 = buildMember(USER_ID);
            FamilyCircleMember member2 = buildMember(MEMBER2_ID);
            FamilyMessage saved = buildMessage();

            when(memberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.of(member1));
            when(messageRepository.save(any(FamilyMessage.class))).thenReturn(saved);
            when(memberRepository.findAllById_FamilyCircleId(CIRCLE_ID))
                    .thenReturn(List.of(member1, member2));

            SendMessageRequest req = SendMessageRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .setMessageContent("Broadcast test")
                    .build();

            service.sendFamilyMessage(USER_ID, req);

            // Publisher should be called once per circle member
            verify(redisPublisher, times(2)).publishMessage(any(), any(UUID.class), eq(true));
        }
    }

    // ── listFamilyMessages ────────────────────────────────────────────────────

    @Nested
    @DisplayName("listFamilyMessages Tests")
    class ListFamilyMessagesTests {

        @Test
        void should_returnFirstPage_withBlankToken() {
            FamilyCircleMember member = buildMember(USER_ID);
            FamilyMessage msg = buildMessage();
            Slice<FamilyMessage> slice = new SliceImpl<>(List.of(msg), PageRequest.of(0, 20), false);

            when(memberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.of(member));
            when(messageRepository.findFirstPageByFamilyCircleId(eq(CIRCLE_ID), any()))
                    .thenReturn(slice);

            ListMessagesRequest req = ListMessagesRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .setPageSize(20)
                    .build();

            ListMessagesResponse res = service.listFamilyMessages(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            assertEquals(1, res.getMessagesCount());
            assertTrue(res.getNextPageToken().isBlank());
        }

        @Test
        void should_returnNextPageToken_whenHasMore() {
            FamilyCircleMember member = buildMember(USER_ID);
            FamilyMessage msg = buildMessage();
            Slice<FamilyMessage> slice = new SliceImpl<>(List.of(msg), PageRequest.of(0, 2), true);

            when(memberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.of(member));
            when(messageRepository.findFirstPageByFamilyCircleId(eq(CIRCLE_ID), any()))
                    .thenReturn(slice);

            ListMessagesRequest req = ListMessagesRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .setPageSize(2)
                    .build();

            ListMessagesResponse res = service.listFamilyMessages(USER_ID, req);

            assertFalse(res.getNextPageToken().isBlank());
        }

        @Test
        void should_returnPermissionDenied_whenUserNotMember() {
            when(memberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.empty());

            ListMessagesRequest req = ListMessagesRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .build();

            ListMessagesResponse res = service.listFamilyMessages(USER_ID, req);

            assertEquals(Code.PERMISSION_DENIED_VALUE, res.getStatus().getCode());
            verify(messageRepository, never()).findFirstPageByFamilyCircleId(any(), any());
        }

        @Test
        void should_fetchNextPage_whenPageTokenProvided() {
            FamilyCircleMember member = buildMember(USER_ID);
            FamilyMessage msg = buildMessage();
            Slice<FamilyMessage> slice = new SliceImpl<>(List.of(msg), PageRequest.of(0, 20), false);

            PageToken token = new PageToken(System.currentTimeMillis(), MSG_ID.toString());
            String encoded = PageTokenCodec.encode(token);

            when(memberRepository.findById_FamilyCircleIdAndId_MemberId(CIRCLE_ID, USER_ID))
                    .thenReturn(Optional.of(member));
            when(messageRepository.findNextPageByFamilyCircleId(eq(CIRCLE_ID), any(), any(), any()))
                    .thenReturn(slice);

            ListMessagesRequest req = ListMessagesRequest.newBuilder()
                    .setFamilyCircleId(CIRCLE_ID.toString())
                    .setPageToken(encoded)
                    .setPageSize(20)
                    .build();

            ListMessagesResponse res = service.listFamilyMessages(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            verify(messageRepository).findNextPageByFamilyCircleId(eq(CIRCLE_ID), any(), any(), any());
        }
    }
}
