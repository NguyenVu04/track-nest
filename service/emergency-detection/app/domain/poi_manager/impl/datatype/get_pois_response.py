from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

class GetPoisResponse(BaseModel):
    id: UUID = Field(..., description="Unique identifier of the POI", examples=["00000000-0000-0000-0000-000000000000"])
    longitude: float = Field(..., description="Longitude of the POI", examples=[0.0])
    latitude: float = Field(..., description="Latitude of the POI", examples=[0.0])
    radius: float = Field(..., description="Radius of the POI", examples=[0.0])
    name: str = Field(..., description="Name of the POI", examples=["Home"])
    created_at: int = Field(..., description="Date and time when the POI was created", examples=[1700000000000])