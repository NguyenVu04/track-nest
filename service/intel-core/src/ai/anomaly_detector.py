from __future__ import annotations

from typing import Protocol, runtime_checkable

from src.domain.mobility.location_message import LocationMessage


@runtime_checkable
class AnomalyDetector(Protocol):
    """Detects whether a location update represents anomalous mobility behaviour."""

    def is_anomaly(self, message: LocationMessage) -> bool:
        """Return True if the location update is anomalous, False otherwise."""
        ...


class MockAnomalyDetector:
    """Stub detector that always reports no anomaly.

    Replace the body of ``is_anomaly`` with real ML inference once the model is
    ready — the ``MobilityMonitor`` only depends on the ``AnomalyDetector``
    Protocol, so no other code needs to change.

    Example signals to use when implementing the real detector:
    - ``message.velocityMps``   — sudden speed spikes
    - ``message.accuracyMeter`` — GPS jitter indicating spoofing
    - ``message.latitudeDeg`` / ``message.longitudeDeg`` — geographic fence checks
    - ``message.timestampMs``   — irregular reporting intervals
    """

    def is_anomaly(self, message: LocationMessage) -> bool:
        # TODO: replace with real model inference
        return False
