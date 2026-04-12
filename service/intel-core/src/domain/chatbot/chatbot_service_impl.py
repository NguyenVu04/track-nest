from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from src.domain.chatbot.datatype.get_session_dto import GetSessionResponse
from src.domain.chatbot.datatype.post_message_dto import (
    PostMessageRequest,
    PostMessageResponse,
)
from src.domain.chatbot.datatype.post_session_dto import (
    PostSessionRequest,
    PostSessionResponse,
)

class ChatbotServiceImpl:
    async def get_status(self) -> str:
        """Get the status of the chatbot."""
        return "Chatbot is running"
    
    async def start_session(
            self, 
            user_id: UUID, 
            request: PostSessionRequest, 
            db: Session
    ) -> PostSessionResponse:
        """Start a new chatbot session for the authenticated user."""
        raise NotImplementedError("start_session method is not implemented yet.")
    
    async def send_message(
            self, 
            user_id: UUID, 
            request: PostMessageRequest, 
            db: Session
    ) -> PostMessageResponse:
        """Send a message to the chatbot and receive a response."""
        raise NotImplementedError("send_message method is not implemented yet.")
    
    async def retrieve_session(
            self, 
            user_id: UUID, 
            session_id: UUID, 
            db: Session
    ) -> GetSessionResponse:
        """Retrieve the details of a chatbot session."""
        raise NotImplementedError("retrieve_session method is not implemented yet.")