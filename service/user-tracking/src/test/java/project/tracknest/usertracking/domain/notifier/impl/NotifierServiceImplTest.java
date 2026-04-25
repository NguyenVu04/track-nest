package project.tracknest.usertracking.domain.notifier.impl;

import com.google.rpc.Code;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;
import org.springframework.data.domain.PageRequest;
import project.tracknest.usertracking.core.entity.*;
import project.tracknest.usertracking.core.utils.PageTokenCodec;
import project.tracknest.usertracking.core.datatype.PageToken;
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
class NotifierServiceImplTest {

    @Mock NotifierUserRepository userRepository;
    @Mock NotifierMobileDeviceRepository mobileRepository;
    @Mock NotifierRiskNotificationRepository riskNotificationRepository;
    @Mock NotifierTrackingNotificationRepository trackingNotificationRepository;
    @Mock NotifierTrackerTrackingNotificationRepository trackerNotificationRepository;

    @InjectMocks
    NotifierServiceImpl service;

    private static final UUID USER_ID = UUID.fromString("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    private static final UUID DEVICE_ID = UUID.fromString("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    private static final UUID NOTIF_ID = UUID.fromString("cccccccc-cccc-4ccc-8ccc-cccccccccccc");

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User buildUser() {
        return User.builder()
                .id(USER_ID)
                .username("testuser")
                .avatarUrl(null)
                .connected(true)
                .lastActive(OffsetDateTime.now(ZoneOffset.UTC))
                .build();
    }

    private MobileDevice buildDevice() {
        return MobileDevice.builder()
                .id(DEVICE_ID)
                .userId(USER_ID)
                .deviceToken("token-abc")
                .platform("android")
                .languageCode("en")
                .build();
    }

    private TrackingNotification buildTrackingNotif() {
        return TrackingNotification.builder()
                .id(NOTIF_ID)
                .target(buildUser())
                .title("Test tracking title")
                .content("Test tracking content text")
                .type("ANOMALY")
                .createdAt(OffsetDateTime.now(ZoneOffset.UTC))
                .build();
    }

    private RiskNotification buildRiskNotif() {
        return RiskNotification.builder()
                .id(NOTIF_ID)
                .user(buildUser())
                .title("Test risk title!!")
                .content("Test risk content text!!")
                .type("RISK")
                .createdAt(OffsetDateTime.now(ZoneOffset.UTC))
                .build();
    }

    private TrackerTrackingNotification buildTrackerNotif() {
        return TrackerTrackingNotification.builder()
                .id(TrackerTrackingNotification.TrackerTrackingNotificationId.builder()
                        .trackerId(USER_ID)
                        .notificationId(NOTIF_ID)
                        .build())
                .build();
    }

    // ── registerMobileDevice ──────────────────────────────────────────────────

    @Nested
    @DisplayName("registerMobileDevice Tests")
    class RegisterMobileDeviceTests {

        @Test
        void should_registerDevice_whenValidRequest() {
            RegisterMobileDeviceRequest req = RegisterMobileDeviceRequest.newBuilder()
                    .setDeviceToken("valid-token-123")
                    .setPlatform("android")
                    .setLanguageCode("en")
                    .build();

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            MobileDevice saved = buildDevice();
            when(mobileRepository.saveAndFlush(any(MobileDevice.class))).thenReturn(saved);

            RegisterMobileDeviceResponse res = service.registerMobileDevice(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            assertEquals(DEVICE_ID.toString(), res.getId());
            verify(mobileRepository).saveAndFlush(any(MobileDevice.class));
        }

        @Test
        void should_returnInvalidArgument_whenTokenIsBlank() {
            RegisterMobileDeviceRequest req = RegisterMobileDeviceRequest.newBuilder()
                    .setDeviceToken("   ")
                    .setPlatform("android")
                    .build();

            RegisterMobileDeviceResponse res = service.registerMobileDevice(USER_ID, req);

            assertEquals(Code.INVALID_ARGUMENT_VALUE, res.getStatus().getCode());
            verify(mobileRepository, never()).saveAndFlush(any());
        }

        @Test
        void should_returnInvalidArgument_whenTokenTooLong() {
            String longToken = "a".repeat(513);
            RegisterMobileDeviceRequest req = RegisterMobileDeviceRequest.newBuilder()
                    .setDeviceToken(longToken)
                    .setPlatform("android")
                    .build();

            RegisterMobileDeviceResponse res = service.registerMobileDevice(USER_ID, req);

            assertEquals(Code.INVALID_ARGUMENT_VALUE, res.getStatus().getCode());
        }

        @Test
        void should_returnInvalidArgument_whenPlatformIsBlank() {
            RegisterMobileDeviceRequest req = RegisterMobileDeviceRequest.newBuilder()
                    .setDeviceToken("valid-token")
                    .setPlatform("")
                    .build();

            RegisterMobileDeviceResponse res = service.registerMobileDevice(USER_ID, req);

            assertEquals(Code.INVALID_ARGUMENT_VALUE, res.getStatus().getCode());
        }

        @Test
        void should_returnInvalidArgument_whenPlatformTooLong() {
            RegisterMobileDeviceRequest req = RegisterMobileDeviceRequest.newBuilder()
                    .setDeviceToken("valid-token")
                    .setPlatform("a".repeat(33))
                    .build();

            RegisterMobileDeviceResponse res = service.registerMobileDevice(USER_ID, req);

            assertEquals(Code.INVALID_ARGUMENT_VALUE, res.getStatus().getCode());
        }

        @Test
        void should_returnInvalidArgument_whenLanguageCodeTooLong() {
            RegisterMobileDeviceRequest req = RegisterMobileDeviceRequest.newBuilder()
                    .setDeviceToken("valid-token")
                    .setPlatform("android")
                    .setLanguageCode("toolongcode")
                    .build();

            RegisterMobileDeviceResponse res = service.registerMobileDevice(USER_ID, req);

            assertEquals(Code.INVALID_ARGUMENT_VALUE, res.getStatus().getCode());
        }

        @Test
        void should_returnInternal_whenUserNotFound() {
            RegisterMobileDeviceRequest req = RegisterMobileDeviceRequest.newBuilder()
                    .setDeviceToken("valid-token")
                    .setPlatform("android")
                    .setLanguageCode("en")
                    .build();

            when(userRepository.existsById(USER_ID)).thenReturn(false);

            RegisterMobileDeviceResponse res = service.registerMobileDevice(USER_ID, req);

            assertEquals(Code.INTERNAL_VALUE, res.getStatus().getCode());
            verify(mobileRepository, never()).saveAndFlush(any());
        }
    }

    // ── updateMobileDevice ────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateMobileDevice Tests")
    class UpdateMobileDeviceTests {

        @Test
        void should_updateDevice_whenFound() {
            UpdateMobileDeviceRequest req = UpdateMobileDeviceRequest.newBuilder()
                    .setId(DEVICE_ID.toString())
                    .setDeviceToken("new-token")
                    .setPlatform("ios")
                    .setLanguageCode("vi")
                    .build();

            when(mobileRepository.findByIdAndUserId(DEVICE_ID, USER_ID))
                    .thenReturn(Optional.of(buildDevice()));

            UpdateMobileDeviceResponse res = service.updateMobileDevice(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            verify(mobileRepository).saveAndFlush(any(MobileDevice.class));
        }

        @Test
        void should_returnNotFound_whenDeviceNotFound() {
            UpdateMobileDeviceRequest req = UpdateMobileDeviceRequest.newBuilder()
                    .setId(DEVICE_ID.toString())
                    .setDeviceToken("new-token")
                    .build();

            when(mobileRepository.findByIdAndUserId(DEVICE_ID, USER_ID)).thenReturn(Optional.empty());

            UpdateMobileDeviceResponse res = service.updateMobileDevice(USER_ID, req);

            assertEquals(Code.NOT_FOUND_VALUE, res.getStatus().getCode());
            verify(mobileRepository, never()).saveAndFlush(any());
        }
    }

    // ── unregisterMobileDevice ────────────────────────────────────────────────

    @Nested
    @DisplayName("unregisterMobileDevice Tests")
    class UnregisterMobileDeviceTests {

        @Test
        void should_unregisterDevice_whenFound() {
            UnregisterMobileDeviceRequest req = UnregisterMobileDeviceRequest.newBuilder()
                    .setId(DEVICE_ID.toString())
                    .build();

            when(mobileRepository.findByIdAndUserId(DEVICE_ID, USER_ID))
                    .thenReturn(Optional.of(buildDevice()));

            UnregisterMobileDeviceResponse res = service.unregisterMobileDevice(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            verify(mobileRepository).deleteById(DEVICE_ID);
        }

        @Test
        void should_returnNotFound_whenDeviceAbsent() {
            UnregisterMobileDeviceRequest req = UnregisterMobileDeviceRequest.newBuilder()
                    .setId(DEVICE_ID.toString())
                    .build();

            when(mobileRepository.findByIdAndUserId(DEVICE_ID, USER_ID)).thenReturn(Optional.empty());

            UnregisterMobileDeviceResponse res = service.unregisterMobileDevice(USER_ID, req);

            assertEquals(Code.NOT_FOUND_VALUE, res.getStatus().getCode());
            verify(mobileRepository, never()).deleteById(any());
        }
    }

    // ── listTrackingNotifications ─────────────────────────────────────────────

    @Nested
    @DisplayName("listTrackingNotifications Tests")
    class ListTrackingNotificationsTests {

        @Test
        void should_returnFirstPage_withNextToken_whenHasMore() {
            TrackingNotification notif = buildTrackingNotif();
            Slice<TrackingNotification> slice = new SliceImpl<>(List.of(notif), PageRequest.ofSize(32), true);
            when(trackingNotificationRepository.findFirstPageByTrackerId(eq(USER_ID), any()))
                    .thenReturn(slice);

            ListTrackingNotificationsRequest req = ListTrackingNotificationsRequest.newBuilder().build();
            ListTrackingNotificationsResponse res = service.listTrackingNotifications(USER_ID, req);

            assertEquals(1, res.getTrackingNotificationsCount());
            assertFalse(res.getNextPageToken().isBlank());
        }

        @Test
        void should_returnFirstPage_withoutNextToken_whenNoMore() {
            TrackingNotification notif = buildTrackingNotif();
            Slice<TrackingNotification> slice = new SliceImpl<>(List.of(notif), PageRequest.ofSize(32), false);
            when(trackingNotificationRepository.findFirstPageByTrackerId(eq(USER_ID), any()))
                    .thenReturn(slice);

            ListTrackingNotificationsRequest req = ListTrackingNotificationsRequest.newBuilder().build();
            ListTrackingNotificationsResponse res = service.listTrackingNotifications(USER_ID, req);

            assertEquals(1, res.getTrackingNotificationsCount());
            assertTrue(res.getNextPageToken().isBlank());
        }

        @Test
        void should_returnNextPage_whenCursorProvided() {
            PageToken token = new PageToken(System.currentTimeMillis(), NOTIF_ID.toString());
            String encoded = PageTokenCodec.encode(token);

            TrackingNotification notif = buildTrackingNotif();
            Slice<TrackingNotification> slice = new SliceImpl<>(List.of(notif), PageRequest.ofSize(32), false);
            when(trackingNotificationRepository.findNextPageByTrackerId(eq(USER_ID), any(), any(), any()))
                    .thenReturn(slice);

            ListTrackingNotificationsRequest req = ListTrackingNotificationsRequest.newBuilder()
                    .setPageToken(encoded)
                    .build();
            ListTrackingNotificationsResponse res = service.listTrackingNotifications(USER_ID, req);

            assertEquals(1, res.getTrackingNotificationsCount());
            verify(trackingNotificationRepository).findNextPageByTrackerId(eq(USER_ID), any(), any(), any());
        }
    }

    // ── listRiskNotifications ─────────────────────────────────────────────────

    @Nested
    @DisplayName("listRiskNotifications Tests")
    class ListRiskNotificationsTests {

        @Test
        void should_returnFirstPage_withNextToken_whenHasMore() {
            RiskNotification notif = buildRiskNotif();
            Slice<RiskNotification> slice = new SliceImpl<>(List.of(notif), PageRequest.ofSize(32), true);
            when(riskNotificationRepository.findFirstPageByUserId(eq(USER_ID), any())).thenReturn(slice);

            ListRiskNotificationsRequest req = ListRiskNotificationsRequest.newBuilder().build();
            ListRiskNotificationsResponse res = service.listRiskNotifications(USER_ID, req);

            assertEquals(1, res.getRiskNotificationsCount());
            assertFalse(res.getNextPageToken().isBlank());
        }

        @Test
        void should_returnFirstPage_withoutNextToken_whenNoMore() {
            RiskNotification notif = buildRiskNotif();
            Slice<RiskNotification> slice = new SliceImpl<>(List.of(notif), PageRequest.ofSize(32), false);
            when(riskNotificationRepository.findFirstPageByUserId(eq(USER_ID), any())).thenReturn(slice);

            ListRiskNotificationsRequest req = ListRiskNotificationsRequest.newBuilder().build();
            ListRiskNotificationsResponse res = service.listRiskNotifications(USER_ID, req);

            assertEquals(1, res.getRiskNotificationsCount());
            assertTrue(res.getNextPageToken().isBlank());
        }

        @Test
        void should_returnNextPage_whenCursorProvided() {
            PageToken token = new PageToken(System.currentTimeMillis(), NOTIF_ID.toString());
            String encoded = PageTokenCodec.encode(token);

            RiskNotification notif = buildRiskNotif();
            Slice<RiskNotification> slice = new SliceImpl<>(List.of(notif), PageRequest.ofSize(32), false);
            when(riskNotificationRepository.findNextPageByUserId(eq(USER_ID), any(), any(), any()))
                    .thenReturn(slice);

            ListRiskNotificationsRequest req = ListRiskNotificationsRequest.newBuilder()
                    .setPageToken(encoded)
                    .build();
            ListRiskNotificationsResponse res = service.listRiskNotifications(USER_ID, req);

            assertEquals(1, res.getRiskNotificationsCount());
        }
    }

    // ── deleteTrackingNotification ────────────────────────────────────────────

    @Nested
    @DisplayName("deleteTrackingNotification Tests")
    class DeleteTrackingNotificationTests {

        @Test
        void should_deleteNotification_whenFound() {
            TrackerTrackingNotification ttn = buildTrackerNotif();
            when(trackerNotificationRepository.findById_TrackerIdAndId_NotificationId(USER_ID, NOTIF_ID))
                    .thenReturn(Optional.of(ttn));

            DeleteTrackingNotificationRequest req = DeleteTrackingNotificationRequest.newBuilder()
                    .setId(NOTIF_ID.toString()).build();
            DeleteTrackingNotificationResponse res = service.deleteTrackingNotification(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            verify(trackerNotificationRepository).delete(ttn);
        }

        @Test
        void should_returnNotFound_whenNotificationAbsent() {
            when(trackerNotificationRepository.findById_TrackerIdAndId_NotificationId(USER_ID, NOTIF_ID))
                    .thenReturn(Optional.empty());

            DeleteTrackingNotificationRequest req = DeleteTrackingNotificationRequest.newBuilder()
                    .setId(NOTIF_ID.toString()).build();
            DeleteTrackingNotificationResponse res = service.deleteTrackingNotification(USER_ID, req);

            assertEquals(Code.NOT_FOUND_VALUE, res.getStatus().getCode());
            verify(trackerNotificationRepository, never()).delete(any());
        }
    }

    // ── deleteRiskNotification ────────────────────────────────────────────────

    @Nested
    @DisplayName("deleteRiskNotification Tests")
    class DeleteRiskNotificationTests {

        @Test
        void should_deleteRiskNotification_whenFound() {
            RiskNotification notif = buildRiskNotif();
            when(riskNotificationRepository.findByIdAndUserId(NOTIF_ID, USER_ID))
                    .thenReturn(Optional.of(notif));

            DeleteRiskNotificationRequest req = DeleteRiskNotificationRequest.newBuilder()
                    .setId(NOTIF_ID.toString()).build();
            DeleteRiskNotificationResponse res = service.deleteRiskNotification(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            verify(riskNotificationRepository).deleteById(NOTIF_ID);
        }

        @Test
        void should_returnNotFound_whenRiskNotificationAbsent() {
            when(riskNotificationRepository.findByIdAndUserId(NOTIF_ID, USER_ID))
                    .thenReturn(Optional.empty());

            DeleteRiskNotificationRequest req = DeleteRiskNotificationRequest.newBuilder()
                    .setId(NOTIF_ID.toString()).build();
            DeleteRiskNotificationResponse res = service.deleteRiskNotification(USER_ID, req);

            assertEquals(Code.NOT_FOUND_VALUE, res.getStatus().getCode());
        }
    }

    // ── deleteTrackingNotifications (batch) ───────────────────────────────────

    @Nested
    @DisplayName("deleteTrackingNotifications Tests")
    class DeleteTrackingNotificationsTests {

        @Test
        void should_deleteBatch_whenFound() {
            TrackerTrackingNotification ttn = buildTrackerNotif();
            when(trackerNotificationRepository.findUserNotificationIds(anyList(), eq(USER_ID)))
                    .thenReturn(List.of(ttn));

            DeleteTrackingNotificationsRequest req = DeleteTrackingNotificationsRequest.newBuilder()
                    .addIds(NOTIF_ID.toString()).build();
            DeleteTrackingNotificationsResponse res = service.deleteTrackingNotifications(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            verify(trackerNotificationRepository).deleteAll(List.of(ttn));
        }

        @Test
        void should_returnNotFound_whenBatchEmpty() {
            when(trackerNotificationRepository.findUserNotificationIds(anyList(), eq(USER_ID)))
                    .thenReturn(List.of());

            DeleteTrackingNotificationsRequest req = DeleteTrackingNotificationsRequest.newBuilder()
                    .addIds(NOTIF_ID.toString()).build();
            DeleteTrackingNotificationsResponse res = service.deleteTrackingNotifications(USER_ID, req);

            assertEquals(Code.NOT_FOUND_VALUE, res.getStatus().getCode());
        }
    }

    // ── deleteRiskNotifications (batch) ──────────────────────────────────────

    @Nested
    @DisplayName("deleteRiskNotifications Tests")
    class DeleteRiskNotificationsTests {

        @Test
        void should_deleteBatch_whenFound() {
            RiskNotification notif = buildRiskNotif();
            when(riskNotificationRepository.findUserRiskNotifications(anyList(), eq(USER_ID)))
                    .thenReturn(List.of(notif));

            DeleteRiskNotificationsRequest req = DeleteRiskNotificationsRequest.newBuilder()
                    .addIds(NOTIF_ID.toString()).build();
            DeleteRiskNotificationsResponse res = service.deleteRiskNotifications(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            verify(riskNotificationRepository).deleteAll(List.of(notif));
        }

        @Test
        void should_returnNotFound_whenBatchEmpty() {
            when(riskNotificationRepository.findUserRiskNotifications(anyList(), eq(USER_ID)))
                    .thenReturn(List.of());

            DeleteRiskNotificationsRequest req = DeleteRiskNotificationsRequest.newBuilder()
                    .addIds(NOTIF_ID.toString()).build();
            DeleteRiskNotificationsResponse res = service.deleteRiskNotifications(USER_ID, req);

            assertEquals(Code.NOT_FOUND_VALUE, res.getStatus().getCode());
        }
    }

    // ── clearTrackingNotifications ────────────────────────────────────────────

    @Nested
    @DisplayName("clearTrackingNotifications Tests")
    class ClearTrackingNotificationsTests {

        @Test
        void should_clearAll_andReturnOk() {
            ClearTrackingNotificationsRequest req = ClearTrackingNotificationsRequest.newBuilder().build();
            ClearTrackingNotificationsResponse res = service.clearTrackingNotifications(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            verify(trackerNotificationRepository).deleteById_TrackerId(USER_ID);
        }
    }

    // ── clearRiskNotifications ────────────────────────────────────────────────

    @Nested
    @DisplayName("clearRiskNotifications Tests")
    class ClearRiskNotificationsTests {

        @Test
        void should_clearAll_andReturnOk() {
            ClearRiskNotificationsRequest req = ClearRiskNotificationsRequest.newBuilder().build();
            ClearRiskNotificationsResponse res = service.clearRiskNotifications(USER_ID, req);

            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
            verify(riskNotificationRepository).deleteByUserId(USER_ID);
        }
    }

    // ── countTrackingNotifications ────────────────────────────────────────────

    @Nested
    @DisplayName("countTrackingNotifications Tests")
    class CountTrackingNotificationsTests {

        @Test
        void should_returnCorrectCount() {
            when(trackerNotificationRepository.countById_TrackerId(USER_ID)).thenReturn(7);

            CountTrackingNotificationsRequest req = CountTrackingNotificationsRequest.newBuilder().build();
            CountTrackingNotificationsResponse res = service.countTrackingNotifications(USER_ID, req);

            assertEquals(7, res.getTotalCount());
            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
        }
    }

    // ── countRiskNotifications ────────────────────────────────────────────────

    @Nested
    @DisplayName("countRiskNotifications Tests")
    class CountRiskNotificationsTests {

        @Test
        void should_returnCorrectCount() {
            when(riskNotificationRepository.countByUser_Id(USER_ID)).thenReturn(3);

            CountRiskNotificationsRequest req = CountRiskNotificationsRequest.newBuilder().build();
            CountRiskNotificationsResponse res = service.countRiskNotifications(USER_ID, req);

            assertEquals(3, res.getTotalCount());
            assertEquals(Code.OK_VALUE, res.getStatus().getCode());
        }
    }
}
