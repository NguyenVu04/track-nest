package project.tracknest.usertracking.domain.trackingmanager;

import project.tracknest.usertracking.proto.lib.PermissionResponse;
import project.tracknest.usertracking.proto.lib.PostConnectionRequest;
import project.tracknest.usertracking.proto.lib.TargetResponse;
import project.tracknest.usertracking.proto.lib.TrackerResponse;

import java.util.List;
import java.util.UUID;

public interface TrackingManagerService {
    void createConnection(PostConnectionRequest request);
    void deleteConnection(UUID connectionId);
    PermissionResponse createTrackingPermission(UUID trackerId);
    void deleteTrackingPermission(UUID permissionId);
    List<TargetResponse> retrieveUserTargets(UUID userId);
    List<TrackerResponse> retrieveUserTrackers(UUID userId);
    void updateTrackingStatus(UUID userId, boolean isTrackingEnabled);
}