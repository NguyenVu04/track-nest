package project.tracknest.usertracking.domain.tracker.locationquery;

import project.tracknest.usertracking.proto.lib.ListFamilyMemberLocationHistoryRequest;
import project.tracknest.usertracking.proto.lib.ListFamilyMemberLocationHistoryResponse;
import project.tracknest.usertracking.proto.lib.StreamFamilyMemberLocationsRequest;

import java.util.UUID;

public interface LocationQueryService {
    void streamFamilyMemberLocations(
            UUID userId,
            StreamFamilyMemberLocationsRequest request
    );

    ListFamilyMemberLocationHistoryResponse listFamilyMemberLocationHistory(
            UUID userId,
            ListFamilyMemberLocationHistoryRequest request
    );
}
