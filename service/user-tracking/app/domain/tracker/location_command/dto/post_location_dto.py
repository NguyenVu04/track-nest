from datetime import datetime

from pydantic import BaseModel, Field

class PostLocationDto(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in degrees")
    timestamp: datetime
    accuracy: float = Field(default=0.0, ge=0.0, description="Accuracy in meters")