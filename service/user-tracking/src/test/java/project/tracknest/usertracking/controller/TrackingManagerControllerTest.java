package project.tracknest.usertracking.controller;

import com.google.protobuf.BoolValue;
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
import project.tracknest.usertracking.proto.lib.ConnectionRequest;
import project.tracknest.usertracking.proto.lib.PermissionResponse;
import project.tracknest.usertracking.proto.lib.TargetResponse;
import project.tracknest.usertracking.proto.lib.TrackerResponse;

import static org.junit.jupiter.api.Assertions.*;
import static project.tracknest.usertracking.utils.SecuritySetup.setUpSecurityContext;

@SpringBootTest
@ExtendWith(MockitoExtension.class)
@Transactional
class TrackingManagerControllerTest {
    @Autowired
    private TrackingManagerController trackingManagerController;

    @BeforeEach
    public void setUp() {
        setUpSecurityContext();
    }

    @Test
    @SuppressWarnings("unchecked")
    public void postConnection_ShouldCreateConnectionSuccessfully() {
        // Arrange
        StreamObserver<Empty> mockResponseObserver = Mockito.mock(StreamObserver.class);
        ConnectionRequest request = ConnectionRequest.newBuilder()
                .setPermissionId("dddddddd-2005-4000-8000-dddddddddddd")
                .setOtp("OTP0006")
                .build();
        // Act
        trackingManagerController.postConnection(request, mockResponseObserver);

        // Assert
        Mockito.verify(mockResponseObserver, Mockito.times(1)).onNext(Empty.getDefaultInstance());
        Mockito.verify(mockResponseObserver, Mockito.times(1)).onCompleted();
    }

    @Test
    @SuppressWarnings("unchecked")
    public void deleteTracker_ShouldDeleteTrackerSuccessfully() {
        // Arrange
        StreamObserver<Empty> mockResponseObserver = Mockito.mock(StreamObserver.class);
        StringValue request = StringValue.newBuilder()
                .setValue("8c52c01e-42a7-45cc-9254-db8a7601c764")
                .build();

        // Act
        trackingManagerController.deleteTracker(request, mockResponseObserver);

        // Assert
        Mockito.verify(mockResponseObserver, Mockito.times(1)).onNext(Empty.getDefaultInstance());
        Mockito.verify(mockResponseObserver, Mockito.times(1)).onCompleted();
    }

    @Test
    @SuppressWarnings("unchecked")
    public void deleteTarget_ShouldDeleteTargetSuccessfully() {
        // Arrange
        StreamObserver<Empty> mockResponseObserver = Mockito.mock(StreamObserver.class);
        StringValue request = StringValue.newBuilder()
                .setValue("dd382dcf-3652-499c-acdb-5d9ce99a67b8")
                .build();
        // Act
        trackingManagerController.deleteTarget(request, mockResponseObserver);

        // Assert
        Mockito.verify(mockResponseObserver, Mockito.times(1)).onNext(Empty.getDefaultInstance());
        Mockito.verify(mockResponseObserver, Mockito.times(1)).onCompleted();
    }

    @Test
    @SuppressWarnings("unchecked")
    public void postTrackingPermission_ShouldCreatePermissionSuccessfully() {
        // Arrange
        StreamObserver<PermissionResponse> mockResponseObserver = Mockito.mock(StreamObserver.class);
        Empty request = Empty.getDefaultInstance();

        // Act
        trackingManagerController.postTrackingPermission(request, mockResponseObserver);

        // Assert
        ArgumentCaptor<PermissionResponse> captor = ArgumentCaptor.forClass(PermissionResponse.class);
        Mockito.verify(mockResponseObserver, Mockito.times(1)).onNext(captor.capture());
        Mockito.verify(mockResponseObserver, Mockito.times(1)).onCompleted();

        PermissionResponse captured = captor.getValue();
        assertNotNull(captured);
        assertEquals(15, captured.getOtp().length());
    }

    @Test
    @SuppressWarnings("unchecked")
    public void deleteTrackingPermission_ShouldDeletePermissionSuccessfully() {
        // Arrange
        StreamObserver<Empty> mockResponseObserver = Mockito.mock(StreamObserver.class);
        StringValue request = StringValue.newBuilder()
                .setValue("dddddddd-2009-4000-8000-dddddddddddd")
                .build();
        // Act
        trackingManagerController.deleteTrackingPermission(request, mockResponseObserver);

        // Assert
        Mockito.verify(mockResponseObserver, Mockito.times(1)).onNext(Empty.getDefaultInstance());
        Mockito.verify(mockResponseObserver, Mockito.times(1)).onCompleted();
    }

    @Test
    @SuppressWarnings("unchecked")
    public void getUserTargets_ShouldRetrieveTargetsSuccessfully() {
        // Arrange
        StreamObserver<TargetResponse> mockResponseObserver = Mockito.mock(StreamObserver.class);
        Empty request = Empty.getDefaultInstance();

        // Act
        trackingManagerController.getUserTargets(request, mockResponseObserver);

        // Assert
        ArgumentCaptor<TargetResponse> captor = ArgumentCaptor.forClass(TargetResponse.class);
        Mockito.verify(mockResponseObserver, Mockito.atLeastOnce()).onNext(captor.capture());
        assertFalse(captor.getAllValues().isEmpty());
        captor.getAllValues().forEach(response -> {
            assertNotNull(response.getUserId());
            assertNotNull(response.getUsername());
        });
        Mockito.verify(mockResponseObserver, Mockito.times(1)).onCompleted();
    }

    @Test
    @SuppressWarnings("unchecked")
    public void getUserTrackers_ShouldRetrieveTrackersSuccessfully() {
        // Arrange
        StreamObserver<TrackerResponse> mockResponseObserver = Mockito.mock(StreamObserver.class);
        Empty request = Empty.getDefaultInstance();

        // Act
        trackingManagerController.getUserTrackers(request, mockResponseObserver);

        // Assert
        ArgumentCaptor<TrackerResponse> captor = ArgumentCaptor.forClass(TrackerResponse.class);
        Mockito.verify(mockResponseObserver, Mockito.atLeastOnce()).onNext(captor.capture());
        assertFalse(captor.getAllValues().isEmpty());
        captor.getAllValues().forEach(response -> {
            assertNotNull(response.getUserId());
            assertNotNull(response.getUsername());
        });
        Mockito.verify(mockResponseObserver, Mockito.times(1)).onCompleted();
    }

    @Test
    @SuppressWarnings("unchecked")
    public void putTrackingStatus_ShouldUpdateStatusSuccessfully() {
        // Arrange
        StreamObserver<Empty> mockResponseObserver = Mockito.mock(StreamObserver.class);
        BoolValue newStatus = BoolValue.newBuilder().setValue(true).build();

        // Act
        trackingManagerController.putTrackingStatus(
                newStatus,
                mockResponseObserver
        );

        // Assert
        Mockito.verify(mockResponseObserver, Mockito.times(1)).onNext(Empty.getDefaultInstance());
        Mockito.verify(mockResponseObserver, Mockito.times(1)).onCompleted();
    }
}