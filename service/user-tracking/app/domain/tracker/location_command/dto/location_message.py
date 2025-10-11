from pydantic import BaseModel

from datetime import datetime
from uuid import UUID

class LocationMessage(BaseModel):
    user_id: UUID
    latitude: float
    longitude: float
    timestamp: datetime
    accuracy: float = 0.0