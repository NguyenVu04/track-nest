package project.tracknest.usertracking.domain.trackingmanager;

import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.usertracking.core.entity.TrackingPermission;
import project.tracknest.usertracking.core.entity.User;
import project.tracknest.usertracking.proto.lib.ConnectionRequest;
import project.tracknest.usertracking.proto.lib.PermissionResponse;
import project.tracknest.usertracking.proto.lib.TargetResponse;
import project.tracknest.usertracking.proto.lib.TrackerResponse;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class TrackingManagerServiceImpl implements TrackingManagerService {
    @Value("${app.tracking-permission.ttl-seconds:300}")
    private long EXPIRATION_SECONDS;

    private final TrackingManagerUserRepository userRepository;
    private final TrackingManagerPermissionRepository permissionRepository;

    @Scheduled(fixedDelay = 900, timeUnit = TimeUnit.SECONDS)
    @Transactional
    public void cleanupExpiredPermissions() {
        permissionRepository.deleteExpiredPermissions();
        log.info("Expired tracking permissions cleaned up");
        //!TODO: optimize distributed cleanup using redis if needed
    }

    @Override
    @Transactional
    public void createConnection(UUID trackerId, ConnectionRequest request) {
        Optional<TrackingPermission> permissionOpt = permissionRepository
                .findById(UUID.fromString(request.getPermissionId()));

        if (permissionOpt.isEmpty()) {
            log.warn("Tracking permission with id {} not found when creating connection", request.getPermissionId());
            throw new StatusRuntimeException(Status.PERMISSION_DENIED.withDescription("Invalid tracking permission"));
        }

        TrackingPermission permission = permissionOpt.get();
        if (permission.getExpiredAt().isBefore(OffsetDateTime.now())) {
            log.warn("Tracking permission with id {} has expired when creating connection", request.getPermissionId());
            throw new StatusRuntimeException(Status.PERMISSION_DENIED.withDescription("Tracking permission has expired"));
        }

        UUID targetId = permission.getUserId();
        if (trackerId.equals(targetId)) {
            log.warn("User with id {} attempted to track themselves", trackerId);
            throw new StatusRuntimeException(Status.INVALID_ARGUMENT.withDescription("Cannot track oneself"));
        }

        Optional<User> trackerOpt = userRepository.findById(trackerId);
        Optional<User> targetOpt = userRepository.findById(targetId);
        if (trackerOpt.isEmpty()) {
            log.warn("Tracker user with id {} not found when creating connection", trackerId);
            throw new StatusRuntimeException(Status.INTERNAL.withDescription("Tracker user not found"));
        }
        if (targetOpt.isEmpty()) {
            log.warn("Target user with id {} not found when creating connection", targetId);
            throw new StatusRuntimeException(Status.INTERNAL.withDescription("Target user not found"));
        }

        User tracker = trackerOpt.get();

        List<User> targets = tracker.getTargets();
        if (targets.stream().anyMatch(t -> t.getId().equals(targetId))) {
            log.warn("Tracker user with id {} is already tracking target with id {}", trackerId, targetId);
            throw new StatusRuntimeException(Status.ALREADY_EXISTS.withDescription("Connection already exists"));
        }

        tracker.getTargets().add(targetOpt.get());
        userRepository.save(tracker);

        //TODO: notify target user of new tracker
    }

    @Override
    @Transactional
    public void deleteTracker(UUID userId, UUID trackerId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            log.warn("User with id {} not found when deleting tracker", userId);
            return;
        }

        User user = userOpt.get();
        List<User> trackers = user.getTrackers();
        boolean removed = trackers.removeIf(tracker -> tracker.getId().equals(trackerId));
        if (!removed) {
            log.warn("Tracker with id {} not found for user {}", trackerId, userId);
            return;
        }
        userRepository.save(user);

        //TODO: notify tracker user of removal
    }

    @Override
    @Transactional
    public void deleteTarget(UUID userId, UUID targetId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            log.warn("User with id {} not found when deleting target", userId);
            return;
        }

        User user = userOpt.get();
        List<User> targets = user.getTargets();
        boolean removed = targets.removeIf(target -> target.getId().equals(targetId));
        if (!removed) {
            log.warn("Target with id {} not found for user {}", targetId, userId);
            return;
        }
        userRepository.save(user);
    }

    @Override
    public PermissionResponse createTrackingPermission(UUID userId) {
        if (!userRepository.existsById(userId)) {
            log.warn("User with id {} not found when creating tracking permission", userId);
            throw new StatusRuntimeException(Status.INTERNAL.withDescription("User not found"));
        }

        OffsetDateTime currentTime = OffsetDateTime.now();
        OffsetDateTime expiryTime = currentTime.plusSeconds(EXPIRATION_SECONDS);

        TrackingPermission permission = TrackingPermission.builder()
                .userId(userId)
                .createdAt(currentTime)
                .expiredAt(expiryTime)
                .build();
        TrackingPermission savedPermission = permissionRepository.save(permission);
        return PermissionResponse.newBuilder()
                .setId(savedPermission.getId().toString())
                .setCreatedAt(savedPermission.getCreatedAt().toEpochSecond())
                .setExpiredAt(savedPermission.getExpiredAt().toEpochSecond())
                .build();
    }

    @Override
    public void deleteTrackingPermission(UUID userId, UUID permissionId) {
        Optional<TrackingPermission> permissionOpt = permissionRepository.findById(permissionId);
        if (permissionOpt.isEmpty()) {
            log.warn("Tracking permission with id {} not found when deleting", permissionId);
            return;
        }

        TrackingPermission permission = permissionOpt.get();

        if (!userId.equals(permission.getUserId())) {
            log.warn("Tracking permission with id {} does not belong to user {}", permissionId, permission.getUserId());
            throw new StatusRuntimeException(Status.PERMISSION_DENIED.withDescription("Permission does not belong to user"));
        }

        permissionRepository.delete(permission);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TargetResponse> retrieveUserTargets(UUID userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            log.warn("User with id {} not found when retrieving targets", userId);
            return List.of();
        }

        List<User> targets = userOpt.get().getTargets();
        return targets.stream()
                .map(target -> TargetResponse.newBuilder()
                        .setUserId(target.getId().toString())
                        .setUsername(target.getUsername())
                        .setOnline(target.isConnected())
                        .setLastActive(target.getLastActive()
                                .toEpochSecond())
                        .build())
                .toList();
    }

    @Override
    public List<TrackerResponse> retrieveUserTrackers(UUID userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            log.warn("User with id {} not found when retrieving trackers", userId);
            return List.of();
        }
        List<User> trackers = userOpt.get().getTrackers();
        return trackers.stream()
                .map(tracker -> TrackerResponse.newBuilder()
                        .setUserId(tracker.getId().toString())
                        .setUsername(tracker.getUsername())
                        .setOnline(tracker.isConnected())
                        .setLastActive(tracker.getLastActive()
                                .toEpochSecond())
                        .build())
                .toList();
    }

    @Override
    public void updateTrackingStatus(UUID userId, boolean isTrackingEnabled) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            log.warn("User with id {} not found when updating tracking status", userId);
            return;
        }
        User user = userOpt.get();
        user.setConnected(isTrackingEnabled);
        userRepository.save(user);
    }
}
