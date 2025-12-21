package project.tracknest.usertracking.controller;

import com.google.protobuf.Empty;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.usertracking.proto.lib.LocationRequest;

import static org.mockito.Mockito.*;
import static project.tracknest.usertracking.utils.SecuritySetup.setUpSecurityContext;

@SpringBootTest
@ExtendWith(MockitoExtension.class)
@Transactional
class TrackerControllerTest {
    @Autowired
    private TrackerController trackerController;

    @BeforeEach
    public void setUp() {
        setUpSecurityContext();
    }

    @Test
    @SuppressWarnings("unchecked")
    public void updateLocation_ShouldUpdateLocationSuccessfully() {
        // Arrange
        StreamObserver<Empty> mockResponseObserver = Mockito.mock(StreamObserver.class);

        // Act
        StreamObserver<LocationRequest> observer = trackerController.postLocation(mockResponseObserver);
        LocationRequest location1 = LocationRequest.newBuilder()
                .setLatitude(40.7128)
                .setLongitude(-74.0060)
                .setAccuracy(0)
                .setTimestamp(System.currentTimeMillis() / 1000)
                .setVelocity(0)
                .build();
        LocationRequest location2 = LocationRequest.newBuilder()
                .setLatitude(34.0522)
                .setLongitude(-118.2437)
                .setAccuracy(0)
                .setTimestamp(System.currentTimeMillis() / 1000)
                .setVelocity(0)
                .build();

        observer.onNext(location1); // Send location 1
        observer.onNext(location2); // Send location 2
        observer.onCompleted();    // Indicate end of the stream

        // Assert
        verify(mockResponseObserver, times(1)).onCompleted();
        verify(mockResponseObserver, never()).onError(any(Throwable.class));
    }
}