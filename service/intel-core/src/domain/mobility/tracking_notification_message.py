from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel


class TrackingNotificationMessage(BaseModel):
    targetId: UUID
    content: str
    title: str
    type: str
