from pydantic import BaseModel
from datetime import datetime

class LocationQueryWebSocketDto(BaseModel):
    latitude: float
    longitude: float
    timestamp: datetime
    accuracy: float