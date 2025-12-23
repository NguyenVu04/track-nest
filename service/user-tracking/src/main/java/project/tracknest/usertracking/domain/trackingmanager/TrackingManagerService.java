package project.tracknest.usertracking.domain.trackingmanager;

import project.tracknest.usertracking.proto.lib.PermissionResponse;
import project.tracknest.usertracking.proto.lib.PostConnectionRequest;
import project.tracknest.usertracking.proto.lib.TargetResponse;
import project.tracknest.usertracking.proto.lib.TrackerResponse;

import java.util.List;
import java.util.UUID;

public interface TrackingManagerService {
    void createConnection(UUID trackerId, PostConnectionRequest request);
    void deleteTracker(UUID userId, UUID trackerId);
    void deleteTarget(UUID userId, UUID targetId);
    PermissionResponse createTrackingPermission(UUID userId);
    void deleteTrackingPermission(UUID permissionId);
    List<TargetResponse> retrieveUserTargets(UUID userId);
    List<TrackerResponse> retrieveUserTrackers(UUID userId);
    void updateTrackingStatus(UUID userId, boolean isTrackingEnabled);
}