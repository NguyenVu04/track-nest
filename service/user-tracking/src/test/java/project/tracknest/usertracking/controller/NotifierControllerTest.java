package project.tracknest.usertracking.controller;

import com.google.protobuf.Empty;
import com.google.protobuf.StringValue;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.usertracking.proto.lib.RiskNotificationResponse;
import project.tracknest.usertracking.proto.lib.TrackingNotificationResponse;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static project.tracknest.usertracking.utils.SecuritySetup.*;

@SpringBootTest
@ExtendWith(MockitoExtension.class)
@Transactional
class NotifierControllerTest {
    @Autowired
    private NotifierController notifierController;

    @BeforeEach
    public void setUp() {
        setUpSecurityContext();
    }

    @Test
    @SuppressWarnings("unchecked")
    public void postMobileDevice_ShouldRegisterDevice() {
        // Arrange
        StreamObserver<StringValue> mockResponseObserver = Mockito.mock(StreamObserver.class);
        MobileDeviceRequest request = MobileDeviceRequest.newBuilder()
                .setDeviceToken("this_is_a_test_token")
                .setLanguageCode("vi")
                .build();

        // Act
        notifierController.postMobileDevice(request, mockResponseObserver);

        // Assert
        ArgumentCaptor <StringValue> captor = ArgumentCaptor.forClass(StringValue.class);
        Mockito.verify(mockResponseObserver).onNext(captor.capture());
        StringValue response = captor.getValue();
        assertDoesNotThrow(() -> UUID.fromString(response.getValue()));
        Mockito.verify(mockResponseObserver).onCompleted();
    }

    @Test
    @SuppressWarnings("unchecked")
    public void deleteMobileDevice_ShouldDeleteDevice() {
        // Arrange
        StreamObserver<Empty> mockResponseObserver = Mockito.mock(StreamObserver.class);
        StringValue request = StringValue.of("99999999-9999-4999-8999-999999999999");

        // Act
        notifierController.deleteMobileDevice(request, mockResponseObserver);

        // Assert
        Mockito.verify(mockResponseObserver).onNext(Empty.getDefaultInstance());
        Mockito.verify(mockResponseObserver).onCompleted();
    }

    @Test
    @SuppressWarnings("unchecked")
    public void getTrackingNotifications_ShouldRetrieveNotifications() {
        // Arrange
        StreamObserver<TrackingNotificationResponse> mockResponseObserver = Mockito.mock(StreamObserver.class);
        Empty request = Empty.getDefaultInstance();

        // Act
        notifierController.getTrackingNotifications(request, mockResponseObserver);

        // Assert
        ArgumentCaptor<TrackingNotificationResponse> captor = ArgumentCaptor.forClass(TrackingNotificationResponse.class);
        Mockito.verify(mockResponseObserver, Mockito.atLeastOnce()).onNext(captor.capture());
        assertFalse(captor.getAllValues().isEmpty());
        captor.getAllValues().forEach(response -> {
            assertEquals(ADMIN_USER_ID, UUID.fromString(response.getTrackerId()));
            assertEquals(ADMIN_USERNAME, response.getTrackerUsername());
            assertDoesNotThrow(() -> UUID.fromString(response.getTargetId()));
            assertFalse(response.getTargetUsername().isEmpty());
            assertFalse(response.getTitle().isEmpty());
            assertFalse(response.getContent().isEmpty());
            assertTrue(response.getCreatedAt() > 0);
        });
        Mockito.verify(mockResponseObserver).onCompleted();
    }

    @Test
    @SuppressWarnings("unchecked")
    public void getRiskNotifications_ShouldRetrieveNotifications() {
        // Arrange
        StreamObserver<RiskNotificationResponse> mockResponseObserver = Mockito.mock(StreamObserver.class);
        Empty request = Empty.getDefaultInstance();

        // Act
        notifierController.getRiskNotifications(request, mockResponseObserver);

        // Assert
        ArgumentCaptor<RiskNotificationResponse> captor = ArgumentCaptor.forClass(RiskNotificationResponse.class);
        Mockito.verify(mockResponseObserver, Mockito.atLeastOnce()).onNext(captor.capture());
        assertFalse(captor.getAllValues().isEmpty());
        captor.getAllValues().forEach(response -> {
            assertEquals(ADMIN_USER_ID, UUID.fromString(response.getTargetId()));
            assertEquals(ADMIN_USERNAME, response.getTargetUsername());
            assertFalse(response.getTitle().isEmpty());
            assertFalse(response.getContent().isEmpty());
            assertTrue(response.getCreatedAt() > 0);
        });
        Mockito.verify(mockResponseObserver).onCompleted();
    }

    @Test
    @SuppressWarnings("unchecked")
    public void deleteTrackingNotification_ShouldDeleteNotification() {
        // Arrange
        StreamObserver<Empty> mockResponseObserver = Mockito.mock(StreamObserver.class);
        StringValue request = StringValue.of("bbbbbbbb-0008-4000-8000-bbbbbbbbbbbb");

        // Act
        notifierController.deleteTrackingNotification(request, mockResponseObserver);

        // Assert
        Mockito.verify(mockResponseObserver).onNext(Empty.getDefaultInstance());
        Mockito.verify(mockResponseObserver).onCompleted();
    }

    @Test
    @SuppressWarnings("unchecked")
    public void deleteRiskNotification_ShouldDeleteNotification() {
        // Arrange
        StreamObserver<Empty> mockResponseObserver = Mockito.mock(StreamObserver.class);
        StringValue request = StringValue.of("cccccccc-1008-4000-8000-cccccccccccc");

        // Act
        notifierController.deleteRiskNotification(request, mockResponseObserver);

        // Assert
        Mockito.verify(mockResponseObserver).onNext(Empty.getDefaultInstance());
        Mockito.verify(mockResponseObserver).onCompleted();
    }

    @Test
    @SuppressWarnings("unchecked")
    public void deleteTrackingNotifications_ShouldDeleteAllNotifications() {
        // Arrange
        StreamObserver<Empty> mockResponseObserver = Mockito.mock(StreamObserver.class);
        NotificationIds request = NotificationIds.newBuilder()
                .addIds("bbbbbbbb-0008-4000-8000-bbbbbbbbbbbb")
                .addIds("bbbbbbbb-0009-4000-8000-bbbbbbbbbbbb")
                .build();

        // Act
        notifierController.deleteTrackingNotifications(request, mockResponseObserver);

        // Assert
        Mockito.verify(mockResponseObserver).onNext(Empty.getDefaultInstance());
        Mockito.verify(mockResponseObserver).onCompleted();
    }

    @Test
    @SuppressWarnings("unchecked")
    public void deleteRiskNotifications_ShouldDeleteAllNotifications() {
        // Arrange
        StreamObserver<Empty> mockResponseObserver = Mockito.mock(StreamObserver.class);
        NotificationIds request = NotificationIds.newBuilder()
                .addIds("cccccccc-1008-4000-8000-cccccccccccc")
                .addIds("cccccccc-1009-4000-8000-cccccccccccc")
                .build();

        // Act
        notifierController.deleteRiskNotifications(request, mockResponseObserver);

        // Assert
        Mockito.verify(mockResponseObserver).onNext(Empty.getDefaultInstance());
        Mockito.verify(mockResponseObserver).onCompleted();
    }

    @Test
    @SuppressWarnings("unchecked")
    public void deleteAllTrackingNotifications_ShouldDeleteAllNotifications() {
        // Arrange
        StreamObserver<Empty> mockResponseObserver = Mockito.mock(StreamObserver.class);
        Empty request = Empty.getDefaultInstance();

        // Act
        notifierController.deleteAllTrackingNotifications(request, mockResponseObserver);

        // Assert
        Mockito.verify(mockResponseObserver).onNext(Empty.getDefaultInstance());
        Mockito.verify(mockResponseObserver).onCompleted();
    }

    @Test
    @SuppressWarnings("unchecked")
    public void deleteAllRiskNotifications_ShouldDeleteAllNotifications() {
        // Arrange
        StreamObserver<Empty> mockResponseObserver = Mockito.mock(StreamObserver.class);
        Empty request = Empty.getDefaultInstance();

        // Act
        notifierController.deleteAllRiskNotifications(request, mockResponseObserver);

        // Assert
        Mockito.verify(mockResponseObserver).onNext(Empty.getDefaultInstance());
        Mockito.verify(mockResponseObserver).onCompleted();
    }
}