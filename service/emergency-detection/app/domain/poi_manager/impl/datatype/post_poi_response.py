from uuid import UUID

from pydantic import BaseModel, Field

class PostPoiResponse(BaseModel):
    id: UUID = Field(..., description="Unique identifier of the created POI", examples=["00000000-0000-0000-0000-000000000000"])
    created_at_ms: int = Field(..., description="Timestamp of when the POI was created", examples=[1700000000000])