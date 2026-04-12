from uuid import UUID
from pydantic import BaseModel, Field

class GetSessionResponse(BaseModel):
    session_id: UUID = Field(..., description="Unique identifier for the chatbot session", examples=["123e4567-e89b-12d3-a456-426614174000"])
    document_id: UUID = Field(..., description="Unique identifier for the document associated with the session", examples=["123e4567-e89b-12d3-a456-426614174000"])
    created_at: str = Field(..., description="Timestamp when the session was created", examples=["2024-01-01T12:00:00Z"])