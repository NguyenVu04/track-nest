package project.tracknest.emergencyops.domain.emergencyresponder.impl;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import project.tracknest.emergencyops.configuration.cache.ServerRedisMessage;
import project.tracknest.emergencyops.configuration.cache.ServerRedisMessagePublisher;
import project.tracknest.emergencyops.configuration.security.KeycloakService;
import project.tracknest.emergencyops.configuration.security.datatype.KeycloakUserProfile;
import project.tracknest.emergencyops.core.datatype.LocationMessage;
import project.tracknest.emergencyops.core.entity.EmergencyService;
import project.tracknest.emergencyops.core.entity.EmergencyServiceUser;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmergencyResponderServiceImplTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;
    @Mock
    private KeycloakService keycloakService;
    @Mock
    private ServerRedisMessagePublisher redisPublisher;
    @Mock
    private EmergencyResponderEmergencyServiceUserRepository emergencyServiceUserRepository;

    @InjectMocks
    private EmergencyResponderServiceImpl service;

    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID SERVICE_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "userLocationQueue", "/queue/user-location");
    }

    private LocationMessage mockLocationMessage() {
        return LocationMessage.builder()
                .userId(USER_ID)
                .username("john_doe")
                .avatarUrl("http://avatar")
                .latitudeDeg(10.776)
                .longitudeDeg(106.702)
                .timestampMs(System.currentTimeMillis())
                .accuracyMeter(5.0f)
                .velocityMps(1.5f)
                .build();
    }

    private EmergencyService mockEmergencyService() {
        return EmergencyService.builder()
                .id(SERVICE_ID)
                .username("Service A")
                .phoneNumber("+84123456789")
                .latitude(10.0)
                .longitude(106.0)
                .build();
    }

    private EmergencyServiceUser mockServiceUser() {
        return EmergencyServiceUser.builder()
                .userId(USER_ID)
                .emergencyService(mockEmergencyService())
                .lastLatitude(10.775)
                .lastLongitude(106.700)
                .lastUpdateTime(OffsetDateTime.now())
                .build();
    }

    private KeycloakUserProfile mockProfile(UUID id) {
        return new KeycloakUserProfile(id, "user_" + id, "u@mail.com", "First", "Last", "http://avatar", "+1");
    }

    @Nested
    @DisplayName("trackTarget")
    class TrackTarget {

        @Test
        @DisplayName("should_updateLocationAndPublishToRedis_whenUserIsTracked")
        void should_updateLocationAndPublishToRedis_whenUserIsTracked() {
            LocationMessage message = mockLocationMessage();
            EmergencyServiceUser serviceUser = mockServiceUser();

            when(emergencyServiceUserRepository.findById(USER_ID)).thenReturn(Optional.of(serviceUser));
            when(emergencyServiceUserRepository.save(serviceUser)).thenReturn(serviceUser);
            doNothing().when(redisPublisher).publishMessage(any(ServerRedisMessage.class), eq(SERVICE_ID));

            service.trackTarget(message);

            assertEquals(10.776, serviceUser.getLastLatitude());
            assertEquals(106.702, serviceUser.getLastLongitude());
            verify(emergencyServiceUserRepository).save(serviceUser);
            verify(redisPublisher).publishMessage(any(ServerRedisMessage.class), eq(SERVICE_ID));
        }

        @Test
        @DisplayName("should_doNothing_whenUserIsNotTracked")
        void should_doNothing_whenUserIsNotTracked() {
            LocationMessage message = mockLocationMessage();

            when(emergencyServiceUserRepository.findById(USER_ID)).thenReturn(Optional.empty());

            service.trackTarget(message);

            verify(emergencyServiceUserRepository, never()).save(any());
            verify(redisPublisher, never()).publishMessage(any(), any());
        }

        @Test
        @DisplayName("should_updateTimestamp_whenTracking")
        void should_updateTimestamp_whenTracking() {
            long timestampMs = System.currentTimeMillis();
            LocationMessage message = LocationMessage.builder()
                    .userId(USER_ID).username("u").avatarUrl("a")
                    .latitudeDeg(1.0).longitudeDeg(2.0)
                    .timestampMs(timestampMs).accuracyMeter(1f).velocityMps(0f)
                    .build();
            EmergencyServiceUser serviceUser = mockServiceUser();

            when(emergencyServiceUserRepository.findById(USER_ID)).thenReturn(Optional.of(serviceUser));
            when(emergencyServiceUserRepository.save(any())).thenReturn(serviceUser);
            doNothing().when(redisPublisher).publishMessage(any(), any());

            service.trackTarget(message);

            assertNotNull(serviceUser.getLastUpdateTime());
        }
    }

    @Nested
    @DisplayName("receiveLocationMessage")
    class ReceiveLocationMessage {

        @Test
        @DisplayName("should_sendLocationViaWebSocket_toCorrectReceiver")
        void should_sendLocationViaWebSocket_toCorrectReceiver() {
            LocationMessage message = mockLocationMessage();

            service.receiveLocationMessage(SERVICE_ID, message);

            verify(messagingTemplate).convertAndSendToUser(
                    eq(SERVICE_ID.toString()),
                    eq("/queue/user-location"),
                    eq(message)
            );
        }
    }

    @Nested
    @DisplayName("retrieveEmergencyServiceTargets")
    class RetrieveEmergencyServiceTargets {

        @Test
        @DisplayName("should_returnPageOfTargets_withProfilesEnriched")
        void should_returnPageOfTargets_withProfilesEnriched() {
            Pageable pageable = PageRequest.of(0, 10);
            EmergencyServiceUser user = mockServiceUser();
            Page<EmergencyServiceUser> page = new PageImpl<>(List.of(user), pageable, 1);

            when(emergencyServiceUserRepository.findByEmergencyService_Id(SERVICE_ID, pageable)).thenReturn(page);
            when(keycloakService.getUserProfile(USER_ID)).thenReturn(mockProfile(USER_ID));

            var result = service.retrieveEmergencyServiceTargets(SERVICE_ID, pageable);

            assertNotNull(result);
            assertEquals(1, result.items().size());
            assertEquals(1L, result.totalItems());
            var item = result.items().getFirst();
            assertEquals(USER_ID, item.id());
            assertEquals("user_" + USER_ID, item.username());
            assertEquals("First", item.firstName());
            assertEquals("Last", item.lastName());
            assertTrue(item.lastLatitudeDegrees() >= -90);
            assertTrue(item.lastLongitudeDegrees() >= -180);
            assertTrue(item.lastUpdateTimeMs() > 0);
        }

        @Test
        @DisplayName("should_returnEmptyPage_whenNoTargets")
        void should_returnEmptyPage_whenNoTargets() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<EmergencyServiceUser> emptyPage = new PageImpl<>(List.of(), pageable, 0);

            when(emergencyServiceUserRepository.findByEmergencyService_Id(SERVICE_ID, pageable)).thenReturn(emptyPage);

            var result = service.retrieveEmergencyServiceTargets(SERVICE_ID, pageable);

            assertTrue(result.items().isEmpty());
            assertEquals(0L, result.totalItems());
            verifyNoInteractions(keycloakService);
        }

        @Test
        @DisplayName("should_returnMultipleTargets_withDistinctProfiles")
        void should_returnMultipleTargets_withDistinctProfiles() {
            Pageable pageable = PageRequest.of(0, 10);
            UUID userId2 = UUID.randomUUID();
            EmergencyServiceUser user1 = mockServiceUser();
            EmergencyServiceUser user2 = EmergencyServiceUser.builder()
                    .userId(userId2)
                    .emergencyService(mockEmergencyService())
                    .lastLatitude(10.8)
                    .lastLongitude(106.8)
                    .lastUpdateTime(OffsetDateTime.now())
                    .build();
            Page<EmergencyServiceUser> page = new PageImpl<>(List.of(user1, user2), pageable, 2);

            when(emergencyServiceUserRepository.findByEmergencyService_Id(SERVICE_ID, pageable)).thenReturn(page);
            when(keycloakService.getUserProfile(USER_ID)).thenReturn(mockProfile(USER_ID));
            when(keycloakService.getUserProfile(userId2)).thenReturn(mockProfile(userId2));

            var result = service.retrieveEmergencyServiceTargets(SERVICE_ID, pageable);

            assertEquals(2, result.items().size());
            assertEquals(2L, result.totalItems());
        }
    }
}
