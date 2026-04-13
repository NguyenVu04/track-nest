from __future__ import annotations

from typing import Protocol
from uuid import UUID

from google.genai import Client
from sqlalchemy.orm import Session
from src.configuration.storage.storage_service import StorageService
from src.domain.chatbot.datatype.post_message_dto import (
    PostMessageRequest,
    PostMessageResponse,
)
from src.domain.chatbot.datatype.post_session_dto import (
    PostSessionRequest,
    PostSessionResponse,
)
from src.domain.chatbot.datatype.get_session_dto import GetSessionResponse

class ChatbotService(Protocol):
    async def get_status(self) -> str:
        """Get the status of the chatbot."""
        ...

    async def start_session(
            self, 
            user_id: UUID, 
            request: PostSessionRequest,
            db: Session,
            storage: StorageService
    ) -> PostSessionResponse:
        """Start a new chatbot session for the given user."""
        ...

    async def send_message(
            self, 
            user_id: UUID, 
            request: PostMessageRequest,
            db: Session,
            storage: StorageService,
            genai: Client
    ) -> PostMessageResponse:
        """Send a message to the chatbot and receive a response."""
        ...

    async def retrieve_session(
            self, 
            user_id: UUID, 
            session_id: UUID,
            db: Session
        ) -> GetSessionResponse:
        """Retrieve the details of a chatbot session."""
        ...