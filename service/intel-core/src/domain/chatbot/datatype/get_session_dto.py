from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field
from src.core.entity.chat_message import ChatMessageRole

class SessionMessage(BaseModel):
    role: ChatMessageRole = Field(..., description="Identifier for the sender of the message")
    content: str = Field(..., description="Content of the message", examples=["Hello, how can I help you?"])
    created_at: datetime = Field(..., description="Timestamp when the message was sent", examples=[datetime.now().isoformat()])

class GetSessionResponse(BaseModel):
    document_id: UUID = Field(..., description="Unique identifier for the document associated with the session", examples=["123e4567-e89b-12d3-a456-426614174000"])
    created_at: datetime = Field(..., description="Timestamp when the session was created", examples=[datetime.now().isoformat()])
    messages: list[SessionMessage] = Field(..., description="List of messages exchanged in the session", examples=[[SessionMessage(role=ChatMessageRole.USER, content="Hello, how can I help you?", created_at=datetime.now())]])
    message_left: int = Field(..., description="Number of messages left in the session", examples=[10])