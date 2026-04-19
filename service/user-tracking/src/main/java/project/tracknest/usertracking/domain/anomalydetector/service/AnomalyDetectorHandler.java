package project.tracknest.usertracking.domain.anomalydetector.service;

import project.tracknest.usertracking.core.datatype.LocationMessage;

import java.time.OffsetDateTime;
import java.util.UUID;

public interface AnomalyDetectorHandler {
    void detectAnomaly(UUID userId, String username, double latitudeDeg, double longitudeDeg, OffsetDateTime timestamp);
}
