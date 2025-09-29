from datetime import datetime

from pydantic import BaseModel

class PostLocationDto(BaseModel):
    latitude: float
    longitude: float
    timestamp: datetime
    accuracy: float