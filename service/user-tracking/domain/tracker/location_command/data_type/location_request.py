from pydantic import BaseModel, Field
from datetime import datetime

class LocationRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    timestamp: datetime = Field(datetime.now())
    accuracy: float = Field(0.0, ge=0.0)