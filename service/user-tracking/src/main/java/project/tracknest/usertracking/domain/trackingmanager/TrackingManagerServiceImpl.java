package project.tracknest.usertracking.domain.trackingmanager;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.tracknest.usertracking.core.entity.User;
import project.tracknest.usertracking.proto.lib.PermissionResponse;
import project.tracknest.usertracking.proto.lib.PostConnectionRequest;
import project.tracknest.usertracking.proto.lib.TargetResponse;
import project.tracknest.usertracking.proto.lib.TrackerResponse;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TrackingManagerServiceImpl implements TrackingManagerService {
    private final TrackingManagerUserRepository userRepository;

    @Override
    public void createConnection(PostConnectionRequest request) {

    }

    @Override
    public void deleteConnection(UUID connectionId) {

    }

    @Override
    public PermissionResponse createTrackingPermission(UUID trackerId) {
        return null;
    }

    @Override
    public void deleteTrackingPermission(UUID permissionId) {

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
