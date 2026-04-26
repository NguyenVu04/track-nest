package project.tracknest.usertracking.controller;

import io.grpc.stub.ServerCallStreamObserver;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import project.tracknest.usertracking.domain.familymessenger.service.FamilyMessengerService;
import project.tracknest.usertracking.domain.familymessenger.service.FamilyMessengerStreamRegistry;
import project.tracknest.usertracking.proto.lib.*;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static project.tracknest.usertracking.utils.SecuritySetup.*;

@ExtendWith(MockitoExtension.class)
class FamilyMessageControllerTest {

    @Mock
    private FamilyMessengerService service;

    @Mock
    private FamilyMessengerStreamRegistry registry;

    @InjectMocks
    private FamilyMessageController controller;

    @BeforeEach
    void setUp() {
        setUpSecurityContext();
    }

    // ── SendMessage ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("SendMessage")
    class SendMessageTests {

        @Test
        @DisplayName("delegates to service, calls onNext and onCompleted")
        void sendMessage_success() {
            SendMessageRequest request = SendMessageRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .setMessageContent("Hello!")
                    .build();

            SendMessageResponse expected = SendMessageResponse.newBuilder()
                    .setMessageId(UUID.randomUUID().toString())
                    .setSentAtMs(System.currentTimeMillis())
                    .build();

            when(service.sendFamilyMessage(ADMIN_USER_ID, request)).thenReturn(expected);

            @SuppressWarnings("unchecked")
            StreamObserver<SendMessageResponse> obs = mock(StreamObserver.class);

            controller.sendMessage(request, obs);

            verify(obs).onNext(expected);
            verify(obs).onCompleted();
            verify(obs, never()).onError(any());
        }

        @Test
        @DisplayName("non-member response is forwarded as-is")
        void sendMessage_notMember_returnsPermissionDenied() {
            SendMessageRequest request = SendMessageRequest.newBuilder()
                    .setFamilyCircleId(FAMILY_CIRCLE_1_ID)
                    .setMessageContent("Should fail")
                    .build();

            SendMessageResponse permDenied = SendMessageResponse.newBuilder()
                    .setStatus(com.google.rpc.Status.newBuilder()
                            .setCode(com.google.rpc.Code.PERMISSION_DENIED_VALUE)
                            .setMessage("User is not a member of this family circle")
                            .build())
                    .build();

            when(service.sendFamilyMessage(ADMIN_USER_ID, request)).thenReturn(permDenied);

            @SuppressWarnings("unchecked")
            StreamObserver<SendMessageResponse> obs = mock(StreamObserver.class);

            controller.sendMessage(request, obs);

            verify(obs).onNext(permDenied);
            verify(obs).onCompleted();
        }
    }

    // ── ListMessages ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("ListMessages")
    class ListMessagesTests {

        @Test
        @DisplayName("delegates to service and returns result")
        void listMessages_success() {
            ListMessagesRequest request = ListMessagesRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .setPageSize(10)
                    .build();

            ListMessagesResponse expected = ListMessagesResponse.newBuilder().build();
            when(service.listFamilyMessages(ADMIN_USER_ID, request)).thenReturn(expected);

            @SuppressWarnings("unchecked")
            StreamObserver<ListMessagesResponse> obs = mock(StreamObserver.class);

            controller.listMessages(request, obs);

            verify(obs).onNext(expected);
            verify(obs).onCompleted();
            verify(obs, never()).onError(any());
        }

        @Test
        @DisplayName("non-member permission-denied is forwarded")
        void listMessages_notMember_returnsPermissionDenied() {
            ListMessagesRequest request = ListMessagesRequest.newBuilder()
                    .setFamilyCircleId(FAMILY_CIRCLE_1_ID)
                    .build();

            ListMessagesResponse permDenied = ListMessagesResponse.newBuilder()
                    .setStatus(com.google.rpc.Status.newBuilder()
                            .setCode(com.google.rpc.Code.PERMISSION_DENIED_VALUE)
                            .build())
                    .build();

            when(service.listFamilyMessages(ADMIN_USER_ID, request)).thenReturn(permDenied);

            @SuppressWarnings("unchecked")
            StreamObserver<ListMessagesResponse> obs = mock(StreamObserver.class);

            controller.listMessages(request, obs);

            verify(obs).onNext(permDenied);
            verify(obs).onCompleted();
        }
    }

    // ── ReceiveMessageStream ──────────────────────────────────────────────────

    @Nested
    @DisplayName("ReceiveMessageStream")
    class ReceiveMessageStreamTests {

        @Test
        @DisplayName("disables auto-request and registers observer with registry")
        void receiveMessageStream_registersWithRegistry() {
            ReceiveMessageStreamRequest request = ReceiveMessageStreamRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .build();

            String sessionKey = "session-key-123";
            when(registry.register(any(), any(), any())).thenReturn(sessionKey);

            NoOpServerCallStreamObserver<Message> serverObserver = new NoOpServerCallStreamObserver<>();

            controller.receiveMessageStream(request, serverObserver);

            assertTrue(serverObserver.disableAutoRequestCalled);
            verify(registry).register(
                    eq(ADMIN_USER_ID),
                    eq(UUID.fromString(ADMIN_CIRCLE_ID)),
                    eq(serverObserver));
        }

        @Test
        @DisplayName("cancel handler unregisters stream from registry")
        void receiveMessageStream_cancelHandler_unregistersFromRegistry() {
            ReceiveMessageStreamRequest request = ReceiveMessageStreamRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .build();

            String sessionKey = "session-key-abc";
            when(registry.register(any(), any(), any())).thenReturn(sessionKey);

            NoOpServerCallStreamObserver<Message> serverObserver = new NoOpServerCallStreamObserver<>();
            controller.receiveMessageStream(request, serverObserver);

            assertNotNull(serverObserver.cancelHandler);
            serverObserver.cancelHandler.run();

            verify(registry).unregister(eq(sessionKey), eq(serverObserver));
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static class NoOpServerCallStreamObserver<T> extends ServerCallStreamObserver<T> {
        Runnable cancelHandler;
        boolean disableAutoRequestCalled;

        public void setOnCancelHandler(Runnable onCancelHandler) { this.cancelHandler = onCancelHandler; }
        public boolean isCancelled() { return false; }
        public void setCompression(String compression) {}
        public void disableAutoInboundFlowControl() {}
        public void disableAutoRequest() { disableAutoRequestCalled = true; }
        public void request(int count) {}
        public void setMessageCompression(boolean enable) {}
        public boolean isReady() { return true; }
        public void setOnReadyHandler(Runnable onReadyHandler) {}
        public void onNext(T value) {}
        public void onError(Throwable t) {}
        public void onCompleted() {}
    }
}
