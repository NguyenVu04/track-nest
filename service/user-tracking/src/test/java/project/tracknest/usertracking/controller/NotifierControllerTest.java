package project.tracknest.usertracking.controller;

import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import project.tracknest.usertracking.domain.notifier.service.NotifierService;
import project.tracknest.usertracking.proto.lib.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static project.tracknest.usertracking.utils.SecuritySetup.*;

@ExtendWith(MockitoExtension.class)
class NotifierControllerTest {

    @Mock
    private NotifierService service;

    @InjectMocks
    private NotifierController controller;

    @BeforeEach
    void setUp() {
        setUpSecurityContext();
    }

    @Nested
    @DisplayName("RegisterMobileDevice Tests")
    class RegisterMobileDeviceTests {

        @Test
        void registerMobileDevice_success() {
            RegisterMobileDeviceRequest req = RegisterMobileDeviceRequest.newBuilder()
                    .setDeviceToken("token123")
                    .setPlatform("android")
                    .setLanguageCode("en")
                    .build();
            RegisterMobileDeviceResponse res = RegisterMobileDeviceResponse.newBuilder()
                    .setId(ADMIN_DEVICE_ID)
                    .build();
            when(service.registerMobileDevice(ADMIN_USER_ID, req)).thenReturn(res);
            @SuppressWarnings("unchecked")
            StreamObserver<RegisterMobileDeviceResponse> obs = mock(StreamObserver.class);

            controller.registerMobileDevice(req, obs);

            verify(obs).onNext(res);
            verify(obs).onCompleted();
            verify(obs, never()).onError(any());
        }

        @Test
        void registerMobileDevice_missingToken_returnsInvalidArgument() {
            RegisterMobileDeviceRequest req = RegisterMobileDeviceRequest.newBuilder().build();
            RegisterMobileDeviceResponse invalid = RegisterMobileDeviceResponse.newBuilder()
                    .setStatus(com.google.rpc.Status.newBuilder()
                            .setCode(com.google.rpc.Code.INVALID_ARGUMENT_VALUE)
                            .build())
                    .build();
            when(service.registerMobileDevice(ADMIN_USER_ID, req)).thenReturn(invalid);
            @SuppressWarnings("unchecked")
            StreamObserver<RegisterMobileDeviceResponse> obs = mock(StreamObserver.class);

            controller.registerMobileDevice(req, obs);

            ArgumentCaptor<RegisterMobileDeviceResponse> captor =
                    ArgumentCaptor.forClass(RegisterMobileDeviceResponse.class);
            verify(obs).onNext(captor.capture());
            assertNotEquals(0, captor.getValue().getStatus().getCode());
            verify(obs).onCompleted();
        }
    }

    @Nested
    @DisplayName("UnregisterMobileDevice Tests")
    class UnregisterMobileDeviceTests {

        @Test
        void unregisterMobileDevice_success() {
            UnregisterMobileDeviceRequest req = UnregisterMobileDeviceRequest.newBuilder()
                    .setId(ADMIN_DEVICE_ID).build();
            UnregisterMobileDeviceResponse res = UnregisterMobileDeviceResponse.newBuilder().build();
            when(service.unregisterMobileDevice(ADMIN_USER_ID, req)).thenReturn(res);
            @SuppressWarnings("unchecked")
            StreamObserver<UnregisterMobileDeviceResponse> obs = mock(StreamObserver.class);

            controller.unregisterMobileDevice(req, obs);

            verify(obs).onNext(res);
            verify(obs).onCompleted();
        }

        @Test
        void unregisterMobileDevice_notFound() {
            UnregisterMobileDeviceRequest req = UnregisterMobileDeviceRequest.newBuilder()
                    .setId("00000000-0000-0000-0000-000000000000").build();
            UnregisterMobileDeviceResponse notFound = UnregisterMobileDeviceResponse.newBuilder()
                    .setStatus(com.google.rpc.Status.newBuilder()
                            .setCode(com.google.rpc.Code.NOT_FOUND_VALUE)
                            .build())
                    .build();
            when(service.unregisterMobileDevice(ADMIN_USER_ID, req)).thenReturn(notFound);
            @SuppressWarnings("unchecked")
            StreamObserver<UnregisterMobileDeviceResponse> obs = mock(StreamObserver.class);

            controller.unregisterMobileDevice(req, obs);

            verify(obs).onNext(notFound);
            verify(obs).onCompleted();
        }
    }

    @Nested
    @DisplayName("ListTrackingNotifications Tests")
    class ListTrackingNotificationsTests {

        @Test
        void listTrackingNotifications_success() {
            ListTrackingNotificationsRequest req = ListTrackingNotificationsRequest.newBuilder().build();
            ListTrackingNotificationsResponse res = ListTrackingNotificationsResponse.newBuilder().build();
            when(service.listTrackingNotifications(ADMIN_USER_ID, req)).thenReturn(res);
            @SuppressWarnings("unchecked")
            StreamObserver<ListTrackingNotificationsResponse> obs = mock(StreamObserver.class);

            controller.listTrackingNotifications(req, obs);

            verify(obs).onNext(res);
            verify(obs).onCompleted();
        }
    }

    @Nested
    @DisplayName("ListRiskNotifications Tests")
    class ListRiskNotificationsTests {

        @Test
        void listRiskNotifications_success() {
            ListRiskNotificationsRequest req = ListRiskNotificationsRequest.newBuilder().build();
            ListRiskNotificationsResponse res = ListRiskNotificationsResponse.newBuilder().build();
            when(service.listRiskNotifications(ADMIN_USER_ID, req)).thenReturn(res);
            @SuppressWarnings("unchecked")
            StreamObserver<ListRiskNotificationsResponse> obs = mock(StreamObserver.class);

            controller.listRiskNotifications(req, obs);

            verify(obs).onNext(res);
            verify(obs).onCompleted();
        }
    }

    @Nested
    @DisplayName("DeleteTrackingNotification Tests")
    class DeleteTrackingNotificationTests {

        @Test
        void deleteTrackingNotification_success() {
            DeleteTrackingNotificationRequest req = DeleteTrackingNotificationRequest.newBuilder()
                    .setId(ADMIN_TRACKING_NOTIFICATION_ID).build();
            DeleteTrackingNotificationResponse res = DeleteTrackingNotificationResponse.newBuilder().build();
            when(service.deleteTrackingNotification(ADMIN_USER_ID, req)).thenReturn(res);
            @SuppressWarnings("unchecked")
            StreamObserver<DeleteTrackingNotificationResponse> obs = mock(StreamObserver.class);

            controller.deleteTrackingNotification(req, obs);

            verify(obs).onNext(res);
            verify(obs).onCompleted();
        }

        @Test
        void deleteTrackingNotification_notFound() {
            DeleteTrackingNotificationRequest req = DeleteTrackingNotificationRequest.newBuilder()
                    .setId("00000000-0000-0000-0000-000000000000").build();
            DeleteTrackingNotificationResponse notFound = DeleteTrackingNotificationResponse.newBuilder()
                    .setStatus(com.google.rpc.Status.newBuilder()
                            .setCode(com.google.rpc.Code.NOT_FOUND_VALUE)
                            .build())
                    .build();
            when(service.deleteTrackingNotification(ADMIN_USER_ID, req)).thenReturn(notFound);
            @SuppressWarnings("unchecked")
            StreamObserver<DeleteTrackingNotificationResponse> obs = mock(StreamObserver.class);

            controller.deleteTrackingNotification(req, obs);

            verify(obs).onNext(notFound);
            verify(obs).onCompleted();
        }
    }

    @Nested
    @DisplayName("DeleteRiskNotification Tests")
    class DeleteRiskNotificationTests {

        @Test
        void deleteRiskNotification_success() {
            DeleteRiskNotificationRequest req = DeleteRiskNotificationRequest.newBuilder()
                    .setId(ADMIN_RISK_NOTIFICATION_ID).build();
            DeleteRiskNotificationResponse res = DeleteRiskNotificationResponse.newBuilder().build();
            when(service.deleteRiskNotification(ADMIN_USER_ID, req)).thenReturn(res);
            @SuppressWarnings("unchecked")
            StreamObserver<DeleteRiskNotificationResponse> obs = mock(StreamObserver.class);

            controller.deleteRiskNotification(req, obs);

            verify(obs).onNext(res);
            verify(obs).onCompleted();
        }

        @Test
        void deleteRiskNotification_notFound() {
            DeleteRiskNotificationRequest req = DeleteRiskNotificationRequest.newBuilder()
                    .setId("00000000-0000-0000-0000-000000000000").build();
            DeleteRiskNotificationResponse notFound = DeleteRiskNotificationResponse.newBuilder()
                    .setStatus(com.google.rpc.Status.newBuilder()
                            .setCode(com.google.rpc.Code.NOT_FOUND_VALUE)
                            .build())
                    .build();
            when(service.deleteRiskNotification(ADMIN_USER_ID, req)).thenReturn(notFound);
            @SuppressWarnings("unchecked")
            StreamObserver<DeleteRiskNotificationResponse> obs = mock(StreamObserver.class);

            controller.deleteRiskNotification(req, obs);

            verify(obs).onNext(notFound);
            verify(obs).onCompleted();
        }
    }

    @Nested
    @DisplayName("DeleteTrackingNotifications Tests (batch)")
    class DeleteTrackingNotificationsTests {

        @Test
        void deleteTrackingNotifications_success() {
            DeleteTrackingNotificationsRequest req = DeleteTrackingNotificationsRequest.newBuilder()
                    .addIds(ADMIN_TRACKING_NOTIFICATION_ID).build();
            DeleteTrackingNotificationsResponse res = DeleteTrackingNotificationsResponse.newBuilder().build();
            when(service.deleteTrackingNotifications(ADMIN_USER_ID, req)).thenReturn(res);
            @SuppressWarnings("unchecked")
            StreamObserver<DeleteTrackingNotificationsResponse> obs = mock(StreamObserver.class);

            controller.deleteTrackingNotifications(req, obs);

            verify(obs).onNext(res);
            verify(obs).onCompleted();
        }
    }

    @Nested
    @DisplayName("DeleteRiskNotifications Tests (batch)")
    class DeleteRiskNotificationsTests {

        @Test
        void deleteRiskNotifications_success() {
            DeleteRiskNotificationsRequest req = DeleteRiskNotificationsRequest.newBuilder()
                    .addIds(ADMIN_RISK_NOTIFICATION_ID).build();
            DeleteRiskNotificationsResponse res = DeleteRiskNotificationsResponse.newBuilder().build();
            when(service.deleteRiskNotifications(ADMIN_USER_ID, req)).thenReturn(res);
            @SuppressWarnings("unchecked")
            StreamObserver<DeleteRiskNotificationsResponse> obs = mock(StreamObserver.class);

            controller.deleteRiskNotifications(req, obs);

            verify(obs).onNext(res);
            verify(obs).onCompleted();
        }
    }

    @Nested
    @DisplayName("ClearTrackingNotifications Tests")
    class ClearTrackingNotificationsTests {

        @Test
        void clearTrackingNotifications_success() {
            ClearTrackingNotificationsRequest req = ClearTrackingNotificationsRequest.newBuilder().build();
            ClearTrackingNotificationsResponse res = ClearTrackingNotificationsResponse.newBuilder().build();
            when(service.clearTrackingNotifications(ADMIN_USER_ID, req)).thenReturn(res);
            @SuppressWarnings("unchecked")
            StreamObserver<ClearTrackingNotificationsResponse> obs = mock(StreamObserver.class);

            controller.clearTrackingNotifications(req, obs);

            verify(obs).onNext(res);
            verify(obs).onCompleted();
        }
    }

    @Nested
    @DisplayName("ClearRiskNotifications Tests")
    class ClearRiskNotificationsTests {

        @Test
        void clearRiskNotifications_success() {
            ClearRiskNotificationsRequest req = ClearRiskNotificationsRequest.newBuilder().build();
            ClearRiskNotificationsResponse res = ClearRiskNotificationsResponse.newBuilder().build();
            when(service.clearRiskNotifications(ADMIN_USER_ID, req)).thenReturn(res);
            @SuppressWarnings("unchecked")
            StreamObserver<ClearRiskNotificationsResponse> obs = mock(StreamObserver.class);

            controller.clearRiskNotifications(req, obs);

            verify(obs).onNext(res);
            verify(obs).onCompleted();
        }
    }

    @Nested
    @DisplayName("CountNotifications Tests")
    class CountNotificationsTests {

        @Test
        void countTrackingNotifications_success() {
            CountTrackingNotificationsRequest req = CountTrackingNotificationsRequest.newBuilder().build();
            CountTrackingNotificationsResponse res = CountTrackingNotificationsResponse.newBuilder()
                    .setTotalCount(5).build();
            when(service.countTrackingNotifications(ADMIN_USER_ID, req)).thenReturn(res);
            @SuppressWarnings("unchecked")
            StreamObserver<CountTrackingNotificationsResponse> obs = mock(StreamObserver.class);

            controller.countTrackingNotifications(req, obs);

            ArgumentCaptor<CountTrackingNotificationsResponse> captor =
                    ArgumentCaptor.forClass(CountTrackingNotificationsResponse.class);
            verify(obs).onNext(captor.capture());
            assertEquals(5, captor.getValue().getTotalCount());
            verify(obs).onCompleted();
        }

        @Test
        void countRiskNotifications_success() {
            CountRiskNotificationsRequest req = CountRiskNotificationsRequest.newBuilder().build();
            CountRiskNotificationsResponse res = CountRiskNotificationsResponse.newBuilder()
                    .setTotalCount(3).build();
            when(service.countRiskNotifications(ADMIN_USER_ID, req)).thenReturn(res);
            @SuppressWarnings("unchecked")
            StreamObserver<CountRiskNotificationsResponse> obs = mock(StreamObserver.class);

            controller.countRiskNotifications(req, obs);

            ArgumentCaptor<CountRiskNotificationsResponse> captor =
                    ArgumentCaptor.forClass(CountRiskNotificationsResponse.class);
            verify(obs).onNext(captor.capture());
            assertEquals(3, captor.getValue().getTotalCount());
            verify(obs).onCompleted();
        }

        @Test
        void updateMobileDevice_success() {
            UpdateMobileDeviceRequest req = UpdateMobileDeviceRequest.newBuilder()
                    .setId(ADMIN_DEVICE_ID)
                    .setDeviceToken("new-token")
                    .setPlatform("ios")
                    .setLanguageCode("vi")
                    .build();
            UpdateMobileDeviceResponse res = UpdateMobileDeviceResponse.newBuilder().build();
            when(service.updateMobileDevice(ADMIN_USER_ID, req)).thenReturn(res);
            @SuppressWarnings("unchecked")
            StreamObserver<UpdateMobileDeviceResponse> obs = mock(StreamObserver.class);

            controller.updateMobileDevice(req, obs);

            verify(obs).onNext(res);
            verify(obs).onCompleted();
        }
    }
}
