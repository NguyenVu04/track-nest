from uuid import UUID

from pydantic import BaseModel, Field


class DeletePoiResponse(BaseModel):
    id: UUID = Field(..., description="Unique identifier of the deleted POI", examples=["00000000-0000-0000-0000-000000000000"])
    deleted_at_ms: int = Field(..., description="Timestamp of when the POI was deleted", examples=[1700000000000])