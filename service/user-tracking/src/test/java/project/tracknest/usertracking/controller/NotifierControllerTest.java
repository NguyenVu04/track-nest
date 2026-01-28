package project.tracknest.usertracking.controller;

import io.grpc.stub.StreamObserver;
import jakarta.validation.ConstraintViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
@Transactional
class NotifierControllerTest {
    @Autowired
    private NotifierController notifierController;

    @BeforeEach
    public void setUp() {
        setUpSecurityContext();
    }

    @Nested
    @DisplayName("RegisterMobileDevice")
    class RegisterMobileDeviceTests {
        @Test
        void registerMobileDevice_success() throws Exception {
            RegisterMobileDeviceRequest request = RegisterMobileDeviceRequest.newBuilder()
                    .setDeviceToken("token-user1-1")
                    .setPlatform("android")
                    .setLanguageCode("en")
                    .build();
            AtomicReference<RegisterMobileDeviceResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            notifierController.registerMobileDevice(request, new StreamObserver<>() {
                public void onNext(RegisterMobileDeviceResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(0, ref.get().getStatus().getCode());
            assertNotNull(ref.get().getId());
        }
        @Test
        void registerMobileDevice_missingToken() throws Exception {
            RegisterMobileDeviceRequest request = RegisterMobileDeviceRequest.newBuilder()
                    .setPlatform("android")
                    .setLanguageCode("en")
                    .build();
            assertThrows(ConstraintViolationException.class, () -> {
                notifierController.registerMobileDevice(request, new StreamObserver<>() {
                    public void onNext(RegisterMobileDeviceResponse value) { }
                    public void onError(Throwable t) { throw new RuntimeException(t); }
                    public void onCompleted() { }
                });
            });
        }
    }

    @Nested
    @DisplayName("UnregisterMobileDevice")
    class UnregisterMobileDeviceTests {
        @Test
        void unregisterMobileDevice_success() throws Exception {
            UnregisterMobileDeviceRequest request = UnregisterMobileDeviceRequest.newBuilder()
                    .setId(ADMIN_DEVICE_ID)
                    .build();
            AtomicReference<UnregisterMobileDeviceResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            notifierController.unregisterMobileDevice(request, new StreamObserver<>() {
                public void onNext(UnregisterMobileDeviceResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(0, ref.get().getStatus().getCode());
        }
        @Test
        void unregisterMobileDevice_notFound() throws Exception {
            UnregisterMobileDeviceRequest request = UnregisterMobileDeviceRequest.newBuilder()
                    .setId("00000000-0000-0000-0000-000000000000")
                    .build();
            AtomicReference<UnregisterMobileDeviceResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            notifierController.unregisterMobileDevice(request, new StreamObserver<>() {
                public void onNext(UnregisterMobileDeviceResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertNotEquals(0, ref.get().getStatus().getCode());
        }
    }

    @Nested
    @DisplayName("ListTrackingNotifications")
    class ListTrackingNotificationsTests {
        @Test
        void listTrackingNotifications_success() throws Exception {
            ListTrackingNotificationsRequest request = ListTrackingNotificationsRequest.newBuilder()
                    .setPageSize(10)
                    .build();
            AtomicReference<ListTrackingNotificationsResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            notifierController.listTrackingNotifications(request, new StreamObserver<>() {
                public void onNext(ListTrackingNotificationsResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertTrue(ref.get().getTrackingNotificationsCount() >= 0);
        }
    }

    @Nested
    @DisplayName("ListRiskNotifications")
    class ListRiskNotificationsTests {
        @Test
        void listRiskNotifications_success() throws Exception {
            ListRiskNotificationsRequest request = ListRiskNotificationsRequest.newBuilder()
                    .setPageSize(10)
                    .build();
            AtomicReference<ListRiskNotificationsResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            notifierController.listRiskNotifications(request, new StreamObserver<>() {
                public void onNext(ListRiskNotificationsResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertTrue(ref.get().getRiskNotificationsCount() >= 0);
        }
    }

    @Nested
    @DisplayName("DeleteTrackingNotification")
    class DeleteTrackingNotificationTests {
        @Test
        void deleteTrackingNotification_success() throws Exception {
            DeleteTrackingNotificationRequest request = DeleteTrackingNotificationRequest.newBuilder()
                    .setId(ADMIN_TRACKING_NOTIFICATION_ID)
                    .build();
            AtomicReference<DeleteTrackingNotificationResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            notifierController.deleteTrackingNotification(request, new StreamObserver<>() {
                public void onNext(DeleteTrackingNotificationResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(0, ref.get().getStatus().getCode());
        }
        @Test
        void deleteTrackingNotification_notFound() throws Exception {
            DeleteTrackingNotificationRequest request = DeleteTrackingNotificationRequest.newBuilder()
                    .setId("00000000-0000-0000-0000-000000000000")
                    .build();
            AtomicReference<DeleteTrackingNotificationResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            notifierController.deleteTrackingNotification(request, new StreamObserver<>() {
                public void onNext(DeleteTrackingNotificationResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertNotEquals(0, ref.get().getStatus().getCode());
        }
    }

    @Nested
    @DisplayName("DeleteRiskNotification")
    class DeleteRiskNotificationTests {
        @Test
        void deleteRiskNotification_success() throws Exception {
            DeleteRiskNotificationRequest request = DeleteRiskNotificationRequest.newBuilder()
                    .setId(ADMIN_RISK_NOTIFICATION_ID)
                    .build();
            AtomicReference<DeleteRiskNotificationResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            notifierController.deleteRiskNotification(request, new StreamObserver<>() {
                public void onNext(DeleteRiskNotificationResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(0, ref.get().getStatus().getCode());
        }
        @Test
        void deleteRiskNotification_notFound() throws Exception {
            DeleteRiskNotificationRequest request = DeleteRiskNotificationRequest.newBuilder()
                    .setId("00000000-0000-0000-0000-000000000000")
                    .build();
            AtomicReference<DeleteRiskNotificationResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            notifierController.deleteRiskNotification(request, new StreamObserver<>() {
                public void onNext(DeleteRiskNotificationResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertNotEquals(0, ref.get().getStatus().getCode());
        }
    }

    @Nested
    @DisplayName("DeleteTrackingNotifications")
    class DeleteTrackingNotificationsTests {
        @Test
        void deleteTrackingNotifications_success() throws Exception {
            DeleteTrackingNotificationsRequest request = DeleteTrackingNotificationsRequest.newBuilder()
                    .addIds(ADMIN_TRACKING_NOTIFICATION_ID)
                    .build();
            AtomicReference<DeleteTrackingNotificationsResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            notifierController.deleteTrackingNotifications(request, new StreamObserver<>() {
                public void onNext(DeleteTrackingNotificationsResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(0, ref.get().getStatus().getCode());
        }
    }

    @Nested
    @DisplayName("DeleteRiskNotifications")
    class DeleteRiskNotificationsTests {
        @Test
        void deleteRiskNotifications_success() throws Exception {
            DeleteRiskNotificationsRequest request = DeleteRiskNotificationsRequest.newBuilder()
                    .addIds(ADMIN_RISK_NOTIFICATION_ID)
                    .build();
            AtomicReference<DeleteRiskNotificationsResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            notifierController.deleteRiskNotifications(request, new StreamObserver<>() {
                public void onNext(DeleteRiskNotificationsResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(0, ref.get().getStatus().getCode());
        }
    }

    @Nested
    @DisplayName("ClearTrackingNotifications")
    class ClearTrackingNotificationsTests {
        @Test
        void clearTrackingNotifications_success() throws Exception {
            ClearTrackingNotificationsRequest request = ClearTrackingNotificationsRequest.newBuilder().build();
            AtomicReference<ClearTrackingNotificationsResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            notifierController.clearTrackingNotifications(request, new StreamObserver<>() {
                public void onNext(ClearTrackingNotificationsResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(0, ref.get().getStatus().getCode());
        }
    }

    @Nested
    @DisplayName("ClearRiskNotifications")
    class ClearRiskNotificationsTests {
        @Test
        void clearRiskNotifications_success() throws Exception {
            ClearRiskNotificationsRequest request = ClearRiskNotificationsRequest.newBuilder().build();
            AtomicReference<ClearRiskNotificationsResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            notifierController.clearRiskNotifications(request, new StreamObserver<>() {
                public void onNext(ClearRiskNotificationsResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertEquals(0, ref.get().getStatus().getCode());
        }
    }

    @Nested
    @DisplayName("CountTrackingNotifications")
    class CountTrackingNotificationsTests {
        @Test
        void countTrackingNotifications_success() throws Exception {
            CountTrackingNotificationsRequest request = CountTrackingNotificationsRequest.newBuilder().build();
            AtomicReference<CountTrackingNotificationsResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            notifierController.countTrackingNotifications(request, new StreamObserver<>() {
                public void onNext(CountTrackingNotificationsResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertTrue(ref.get().getTotalCount() >= 0);
            assertEquals(0, ref.get().getStatus().getCode());
        }
    }

    @Nested
    @DisplayName("CountRiskNotifications")
    class CountRiskNotificationsTests {
        @Test
        void countRiskNotifications_success() throws Exception {
            CountRiskNotificationsRequest request = CountRiskNotificationsRequest.newBuilder().build();
            AtomicReference<CountRiskNotificationsResponse> ref = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);
            notifierController.countRiskNotifications(request, new StreamObserver<>() {
                public void onNext(CountRiskNotificationsResponse value) { ref.set(value); }
                public void onError(Throwable t) { latch.countDown(); }
                public void onCompleted() { latch.countDown(); }
            });
            assertTrue(latch.await(5, TimeUnit.SECONDS));
            assertNotNull(ref.get());
            assertTrue(ref.get().getTotalCount() >= 0);
            assertEquals(0, ref.get().getStatus().getCode());
        }
    }
}