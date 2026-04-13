from __future__ import annotations

import datetime
from google.genai import Client
from uuid import UUID

from sqlalchemy.orm import Session

from src.configuration.storage.storage_service import StorageService
from src.core.entity.chat_message import ChatMessage
from src.core.entity.chat_session import ChatSession
from src.domain.chatbot.datatype.get_session_dto import (
    GetSessionResponse,
    MessageRole,
    SessionMessage,
)
from src.domain.chatbot.datatype.post_message_dto import (
    PostMessageRequest,
    PostMessageResponse,
)
from src.domain.chatbot.datatype.post_session_dto import (
    PostSessionRequest,
    PostSessionResponse,
)

class ChatbotServiceImpl:
    __DEFAULT_FILE_NAME = "index.html"

    async def get_status(self) -> str:
        """Get the status of the chatbot."""
        return "Chatbot is running"
    
    async def start_session(
            self, 
            user_id: UUID, 
            request: PostSessionRequest, 
            db: Session,
            storage: StorageService
    ) -> PostSessionResponse:
        """Start a new chatbot session for the authenticated user."""
        if not storage.file_exists(
            request.document_id, 
            self.__DEFAULT_FILE_NAME
        ):
            raise ValueError(f"Document with ID {request.document_id} does not exist in storage.")
        session = ChatSession(
            user_id=user_id,
            session_id=UUID(),
            document_id=request.document_id,
            started_at=datetime.datetime.now(),
        )
        db.add(session)
        db.commit()
        return PostSessionResponse(session_id=session.id, created_at=session.started_at)
    
    async def send_message(
            self, 
            user_id: UUID, 
            request: PostMessageRequest, 
            db: Session,
            storage: StorageService,
            genai: Client
    ) -> PostMessageResponse:
        """Send a message to the chatbot and receive a response."""
        session = db.query(ChatSession).filter_by(id=request.session_id, user_id=user_id).first()
        if not session:
            raise ValueError(f"Session with ID {request.session_id} not found for user {user_id}.")
        if not storage.file_exists(
            session.document_id, 
            self.__DEFAULT_FILE_NAME
        ):
            raise ValueError(f"Document with ID {session.document_id} does not exist in storage.")
        #TODO: Implement actual chatbot logic using genai client and the document content
        response_text = f"Echo: {request.message}"
        return PostMessageResponse(response=response_text, created_at=datetime.datetime.now())
    
    async def retrieve_session(
            self, 
            user_id: UUID, 
            session_id: UUID, 
            db: Session
    ) -> GetSessionResponse:
        """Retrieve the details of a chatbot session."""
        session = db.query(ChatSession).filter_by(id=session_id, user_id=user_id).first()
        if not session:
            raise ValueError(f"Session with ID {session_id} not found for user {user_id}.")
        
        session_messages = (
            db.query(ChatMessage)
            .filter(
                ChatMessage.session_id == session_id,
                ChatMessage.role.in_((MessageRole.USER.value, MessageRole.ASSISTANT.value)),
            )
            .order_by(ChatMessage.created_at)
            .all()
        )

        return GetSessionResponse(
            document_id=session.document_id,
            created_at=session.started_at,
            messages=[
                SessionMessage(
                    role=MessageRole(message.role),
                    content=message.content,
                    created_at=message.created_at
                )
                for message in session_messages
            ]
        )