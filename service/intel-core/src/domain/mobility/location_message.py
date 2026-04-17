from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel


class LocationMessage(BaseModel):
    userId: UUID
    username: str
    avatarUrl: str
    latitudeDeg: float
    longitudeDeg: float
    timestampMs: int
    accuracyMeter: float
    velocityMps: float
