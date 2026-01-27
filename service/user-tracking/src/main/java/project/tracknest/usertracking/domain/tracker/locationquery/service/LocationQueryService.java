package project.tracknest.usertracking.domain.tracker.locationquery.service;

import project.tracknest.usertracking.proto.lib.FamilyMemberLocation;
import project.tracknest.usertracking.proto.lib.ListFamilyMemberLocationHistoryRequest;
import project.tracknest.usertracking.proto.lib.ListFamilyMemberLocationHistoryResponse;
import project.tracknest.usertracking.proto.lib.StreamFamilyMemberLocationsRequest;

import java.util.List;
import java.util.UUID;

public interface LocationQueryService {
    List<FamilyMemberLocation> streamFamilyMemberLocations(
            UUID userId,
            StreamFamilyMemberLocationsRequest request
    );

    ListFamilyMemberLocationHistoryResponse listFamilyMemberLocationHistory(
            UUID userId,
            ListFamilyMemberLocationHistoryRequest request
    );
}
