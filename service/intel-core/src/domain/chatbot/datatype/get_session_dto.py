from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum

class MessageRole(str, Enum):
    USER = "USER"
    ASSISTANT = "ASSISTANT"

class SessionMessage(BaseModel):
    role: MessageRole = Field(..., description="Identifier for the sender of the message")
    content: str = Field(..., description="Content of the message", examples=["Hello, how can I help you?"])
    created_at: datetime = Field(..., description="Timestamp when the message was sent", examples=[datetime.now().isoformat()])

class GetSessionResponse(BaseModel):
    document_id: UUID = Field(..., description="Unique identifier for the document associated with the session", examples=["123e4567-e89b-12d3-a456-426614174000"])
    created_at: datetime = Field(..., description="Timestamp when the session was created", examples=[datetime.now().isoformat()])
    messages: list[SessionMessage] = Field(..., description="List of messages exchanged in the session", examples=[[SessionMessage(role=MessageRole.USER, content="Hello, how can I help you?", created_at=datetime.now())]])