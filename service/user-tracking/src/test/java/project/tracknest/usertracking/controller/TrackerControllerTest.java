package project.tracknest.usertracking.controller;

import com.google.protobuf.Empty;
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
import project.tracknest.usertracking.proto.lib.LocationHistoryRequest;
import project.tracknest.usertracking.proto.lib.LocationRequest;
import project.tracknest.usertracking.proto.lib.LocationResponse;

import static org.junit.jupiter.api.Assertions.*;

import java.time.OffsetDateTime;

import static org.mockito.Mockito.*;
import static project.tracknest.usertracking.utils.SecuritySetup.*;

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
                .setTimestamp(OffsetDateTime.now().toEpochSecond())
                .setVelocity(0)
                .build();

        observer.onNext(location1); // Send location 1
        observer.onNext(location2); // Send location 2
        observer.onCompleted();    // Indicate end of the stream

        // Assert
        verify(mockResponseObserver, times(1)).onCompleted();
    }

    @Test
    @SuppressWarnings("unchecked")
    public void getTargetsLastLocations_ShouldRetrieveLocationsSuccessfully() {
        // Arrange
        StreamObserver<LocationResponse> mockResponseObserver = Mockito.mock(StreamObserver.class);

        // Act
        trackerController.getTargetsLastLocations(Empty.getDefaultInstance(), mockResponseObserver);

        // Assert
        ArgumentCaptor<LocationResponse> captor = ArgumentCaptor.forClass(LocationResponse.class);
        verify(mockResponseObserver, atLeastOnce()).onNext(captor.capture());

        assertNotNull(captor.getAllValues());
        captor.getAllValues().forEach(response -> {
            assertNotNull(response.getUserId());
            assertNotNull(response.getUsername());
            assertTrue(response.getLatitude() >= -90 && response.getLatitude() <= 90);
            assertTrue(response.getLongitude() >= -180 && response.getLongitude() <= 180);
            assertTrue(response.getAccuracy() >= 0);
            assertTrue(response.getVelocity() > 0);
            assertTrue(response.getTimestamp() > 0);
        });

        verify(mockResponseObserver, times(1)).onCompleted();
    }

    @Test
    @SuppressWarnings("unchecked")
    public void getTargetLocationHistory_ShouldRetrieveLocationHistorySuccessfully() {
        // Arrange
        StreamObserver<LocationResponse> mockResponseObserver = Mockito.mock(StreamObserver.class);
        LocationHistoryRequest request = LocationHistoryRequest.newBuilder()
                .setTargetUserId("dd382dcf-3652-499c-acdb-5d9ce99a67b8")
                .setLatitude(41.0)
                .setLongitude(-74.0)
                .setRadius(40000)
                .build();

        // Act
        trackerController.getTargetLocationHistory(request, mockResponseObserver);

        // Assert
        ArgumentCaptor<LocationResponse> captor = ArgumentCaptor.forClass(LocationResponse.class);
        verify(mockResponseObserver, atLeastOnce()).onNext(captor.capture());
        assertFalse(captor.getAllValues().isEmpty());
        captor.getAllValues().forEach(response -> {
            assertEquals("dd382dcf-3652-499c-acdb-5d9ce99a67b8", response.getUserId());
            assertEquals("user1", response.getUsername());
            assertTrue(response.getLatitude() >= 25 && response.getLatitude() <= 45.0);
            assertTrue(response.getLongitude() >= -79.0 && response.getLongitude() <= -69.0);
            assertTrue(response.getAccuracy() >= 0);
            assertTrue(response.getVelocity() > 0);
            assertTrue(response.getTimestamp() > 0);
        });
        verify(mockResponseObserver, times(1)).onCompleted();
    }
}