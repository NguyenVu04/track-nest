package project.tracknest.usertracking.domain.anomalydetector.service;

import project.tracknest.usertracking.core.datatype.LocationMessage;

public interface AnomalyDetectorHandler {
    void detectAnomaly(LocationMessage locationMessage);
}
