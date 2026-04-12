from datetime import datetime

from pydantic import BaseModel, Field
from uuid import UUID

class PostMessageRequest(BaseModel):
    message: str = Field(..., description="The message to send to the chatbot", min_length=1, max_length=128, examples=["Hello, how are you?"])
    session_id: UUID = Field(..., description="Unique identifier for the chatbot session", examples=["123e4567-e89b-12d3-a456-426614174000"])

class PostMessageResponse(BaseModel):
    response: str = Field(..., description="The response from the chatbot", examples=["Hello! How can I assist you today?"])
    created_at: datetime = Field(..., description="Timestamp when the response was generated", examples=["2024-01-01T12:00:00Z"])