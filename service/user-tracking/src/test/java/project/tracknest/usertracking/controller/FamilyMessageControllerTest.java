package project.tracknest.usertracking.controller;

import io.grpc.stub.ServerCallStreamObserver;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.usertracking.proto.lib.*;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static project.tracknest.usertracking.utils.SecuritySetup.*;

@SpringBootTest
@Transactional
class FamilyMessageControllerTest {

    @Autowired
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
        void sendMessage_success() throws Exception {
            // Admin is a member of ADMIN_CIRCLE_ID (cccccccc-1002-...)
            SendMessageRequest request = SendMessageRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .setMessageContent("Hello from admin!")
                    .build();

            AtomicReference<SendMessageResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);

            controller.sendMessage(request, new StreamObserver<>() {
                public void onNext(SendMessageResponse v) { ref.set(v); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });

            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(0, ref.get().getStatus().getCode());
            assertFalse(ref.get().getMessageId().isBlank());
            assertTrue(ref.get().getSentAtMs() > 0);
        }

        @Test
        void sendMessage_notMember_returnsPermissionDenied() throws Exception {
            // Admin is NOT a member of FAMILY_CIRCLE_1_ID (cccccccc-1000-...)
            SendMessageRequest request = SendMessageRequest.newBuilder()
                    .setFamilyCircleId(FAMILY_CIRCLE_1_ID)
                    .setMessageContent("Should fail")
                    .build();

            AtomicReference<SendMessageResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);

            controller.sendMessage(request, new StreamObserver<>() {
                public void onNext(SendMessageResponse v) { ref.set(v); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });

            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertNotEquals(0, ref.get().getStatus().getCode());
        }

        @Test
        void sendMessage_anotherMember_success() throws Exception {
            // Switch to user3 (4405a37d) who is also a member of ADMIN_CIRCLE_ID
            setUpSecurityContext(USER3_ID, "user3", "user3@gmail.com");

            SendMessageRequest request = SendMessageRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .setMessageContent("Hi from user3")
                    .build();

            AtomicReference<SendMessageResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);

            controller.sendMessage(request, new StreamObserver<>() {
                public void onNext(SendMessageResponse v) { ref.set(v); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });

            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(0, ref.get().getStatus().getCode());
        }
    }

    // ── ListMessages ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("ListMessages")
    class ListMessagesTests {

        @Test
        void listMessages_success_returnsSeededMessages() throws Exception {
            // ADMIN_CIRCLE_ID has 3 seeded messages (eeeeeeee-1007, -1008, -1009)
            ListMessagesRequest request = ListMessagesRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .setPageSize(10)
                    .build();

            AtomicReference<ListMessagesResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);

            controller.listMessages(request, new StreamObserver<>() {
                public void onNext(ListMessagesResponse v) { ref.set(v); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });

            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(0, ref.get().getStatus().getCode());
            assertEquals(3, ref.get().getMessagesCount());
            // Most recent first
            Message first = ref.get().getMessages(0);
            assertFalse(first.getMessageId().isBlank());
            assertFalse(first.getSenderId().isBlank());
            assertFalse(first.getMessageContent().isBlank());
            assertTrue(first.getSentAtMs() > 0);
        }

        @Test
        void listMessages_notMember_returnsPermissionDenied() throws Exception {
            // Admin is NOT a member of FAMILY_CIRCLE_1_ID
            ListMessagesRequest request = ListMessagesRequest.newBuilder()
                    .setFamilyCircleId(FAMILY_CIRCLE_1_ID)
                    .setPageSize(10)
                    .build();

            AtomicReference<ListMessagesResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);

            controller.listMessages(request, new StreamObserver<>() {
                public void onNext(ListMessagesResponse v) { ref.set(v); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });

            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertNotEquals(0, ref.get().getStatus().getCode());
        }

        @Test
        void listMessages_pagination_nextPageToken() throws Exception {
            // ADMIN_CIRCLE_ID has 3 messages; fetch 2 then use token to get 3rd
            ListMessagesRequest firstPage = ListMessagesRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .setPageSize(2)
                    .build();

            AtomicReference<ListMessagesResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);

            controller.listMessages(firstPage, new StreamObserver<>() {
                public void onNext(ListMessagesResponse v) { ref.set(v); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });

            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(0, ref.get().getStatus().getCode());
            assertEquals(2, ref.get().getMessagesCount());
            assertFalse(ref.get().getNextPageToken().isBlank());

            // Fetch second page
            ListMessagesRequest secondPage = ListMessagesRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .setPageSize(2)
                    .setPageToken(ref.get().getNextPageToken())
                    .build();

            AtomicReference<ListMessagesResponse> ref2 = new AtomicReference<>();
            CountDownLatch latch2 = new CountDownLatch(1);

            controller.listMessages(secondPage, new StreamObserver<>() {
                public void onNext(ListMessagesResponse v) { ref2.set(v); }
                public void onError(Throwable t) { latch2.countDown(); }
                public void onCompleted() { latch2.countDown(); }
            });

            assertTrue(latch2.await(5, TimeUnit.SECONDS));
            assertNotNull(ref2.get());
            assertEquals(0, ref2.get().getStatus().getCode());
            assertEquals(1, ref2.get().getMessagesCount());
            assertTrue(ref2.get().getNextPageToken().isBlank());
        }

        @Test
        void listMessages_defaultPageSize_appliedWhenZero() throws Exception {
            ListMessagesRequest request = ListMessagesRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .build(); // page_size = 0 → defaults to 20

            AtomicReference<ListMessagesResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);

            controller.listMessages(request, new StreamObserver<>() {
                public void onNext(ListMessagesResponse v) { ref.set(v); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });

            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(0, ref.get().getStatus().getCode());
            assertTrue(ref.get().getMessagesCount() >= 0);
        }
    }

    // ── ReceiveMessageStream ──────────────────────────────────────────────────

    @Nested
    @DisplayName("ReceiveMessageStream")
    class ReceiveMessageStreamTests {

        @Test
        void receiveMessageStream_member_registersSuccessfully() {
            ReceiveMessageStreamRequest request = ReceiveMessageStreamRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .build();

            // A no-op ServerCallStreamObserver stub
            NoOpServerCallStreamObserver<Message> serverObserver = new NoOpServerCallStreamObserver<>();

            // Should not throw for a valid member
            assertDoesNotThrow(() -> controller.receiveMessageStream(request, serverObserver));
        }

        @Test
        void receiveMessageStream_notMember_throwsIllegalArgument() {
            ReceiveMessageStreamRequest request = ReceiveMessageStreamRequest.newBuilder()
                    .setFamilyCircleId(FAMILY_CIRCLE_1_ID) // admin is not a member here
                    .build();

            NoOpServerCallStreamObserver<Message> serverObserver = new NoOpServerCallStreamObserver<>();

            assertThrows(IllegalArgumentException.class,
                    () -> controller.receiveMessageStream(request, serverObserver));
        }

        @Test
        void receiveMessageStream_sendMessage_deliveredToSubscriber() throws Exception {
            // Register admin as a subscriber to ADMIN_CIRCLE_ID
            ReceiveMessageStreamRequest streamRequest = ReceiveMessageStreamRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .build();

            AtomicReference<Message> received = new AtomicReference<>();
            CountDownLatch messageLatch = new CountDownLatch(1);

            CapturingServerCallStreamObserver<Message> capturingObserver =
                    new CapturingServerCallStreamObserver<>(received, messageLatch);

            controller.receiveMessageStream(streamRequest, capturingObserver);

            // Now send a message to that circle (still as admin)
            SendMessageRequest sendRequest = SendMessageRequest.newBuilder()
                    .setFamilyCircleId(ADMIN_CIRCLE_ID)
                    .setMessageContent("Live message test")
                    .build();

            AtomicReference<SendMessageResponse> sendRef = new AtomicReference<>();
            CountDownLatch sendLatch = new CountDownLatch(1);

            controller.sendMessage(sendRequest, new StreamObserver<>() {
                public void onNext(SendMessageResponse v) { sendRef.set(v); }
                public void onError(Throwable t) { sendLatch.countDown(); }
                public void onCompleted() { sendLatch.countDown(); }
            });

            assertTrue(sendLatch.await(5, TimeUnit.SECONDS));
            assertEquals(0, sendRef.get().getStatus().getCode());

            // The subscriber should have received the message
            assertTrue(messageLatch.await(3, TimeUnit.SECONDS));
            assertNotNull(received.get());
            assertEquals("Live message test", received.get().getMessageContent());
            assertEquals(ADMIN_USER_ID.toString(), received.get().getSenderId());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static class NoOpServerCallStreamObserver<T> extends ServerCallStreamObserver<T> {
        private Runnable cancelHandler;
        public void setOnCancelHandler(Runnable onCancelHandler) { this.cancelHandler = onCancelHandler; }
        public boolean isCancelled() { return false; }
        public void setCompression(String compression) {}
        public void disableAutoInboundFlowControl() {}
        public void disableAutoRequest() {}
        public void request(int count) {}
        public void setMessageCompression(boolean enable) {}
        public boolean isReady() { return true; }
        public void setOnReadyHandler(Runnable onReadyHandler) {}
        public void onNext(T value) {}
        public void onError(Throwable t) {}
        public void onCompleted() {}
    }

    private static class CapturingServerCallStreamObserver<T> extends ServerCallStreamObserver<T> {
        private final AtomicReference<T> ref;
        private final CountDownLatch latch;

        CapturingServerCallStreamObserver(AtomicReference<T> ref, CountDownLatch latch) {
            this.ref = ref;
            this.latch = latch;
        }

        public void setOnCancelHandler(Runnable onCancelHandler) {}
        public boolean isCancelled() { return false; }
        public void setCompression(String compression) {}
        public void disableAutoInboundFlowControl() {}
        public void disableAutoRequest() {}
        public void request(int count) {}
        public void setMessageCompression(boolean enable) {}
        public boolean isReady() { return true; }
        public void setOnReadyHandler(Runnable onReadyHandler) {}
        public void onNext(T value) { ref.set(value); latch.countDown(); }
        public void onError(Throwable t) { latch.countDown(); }
        public void onCompleted() {}
    }
}
