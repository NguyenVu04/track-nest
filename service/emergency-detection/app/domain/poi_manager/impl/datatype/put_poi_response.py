from uuid import UUID

from pydantic import BaseModel, Field


class PutPoiResponse(BaseModel):
    id: UUID = Field(..., description="Unique identifier of the updated POI")
    updated_at_ms: int = Field(..., description="Timestamp of when the POI was updated")