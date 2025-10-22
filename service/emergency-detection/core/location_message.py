from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class LocationMessage(BaseModel):
    id: UUID
    user_id: UUID
    latitude: float
    longitude: float
    timestamp: datetime
    accuracy: float = 0.0