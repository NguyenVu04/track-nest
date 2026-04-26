package project.tracknest.emergencyops.domain.safezonelocator.service;

import project.tracknest.emergencyops.domain.safezonelocator.impl.datatype.GetNearestSafeZonesResponse;

import java.util.List;

public interface SafeZoneLocatorService {
    List<GetNearestSafeZonesResponse> retrieveNearestSafeZones(
            double latitudeDegrees,
            double longitudeDegrees,
            float maxDistanceMeters,
            int maxNumberOfSafeZones
    );
}
