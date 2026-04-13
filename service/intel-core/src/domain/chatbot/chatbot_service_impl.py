from __future__ import annotations

import datetime
from html import unescape
from html.parser import HTMLParser
from google.genai import Client
from google.genai.types import ContentUnionDict, Content, Part
from uuid import UUID

from sqlalchemy.orm import Session

from src.configuration.storage.storage_service import StorageService
from src.core.entity.chat_message import ChatMessage, ChatMessageRole
from src.core.entity.chat_session import ChatSession
from src.domain.chatbot.datatype.get_session_dto import (
    GetSessionResponse,
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
from src.util.settings import Settings, get_settings


class _HTMLTextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._chunks: list[str] = []
        self._skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style"}:
            self._skip_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style"} and self._skip_depth > 0:
            self._skip_depth -= 1

    def handle_data(self, data: str) -> None:
        if self._skip_depth == 0 and data.strip():
            self._chunks.append(data)

    def get_text(self) -> str:
        return " ".join(self._chunks)


class ChatbotServiceImpl:
    __DEFAULT_FILE_NAME = "index.html"
    settings: Settings = get_settings()

    def _strip_html(self, html_content: str) -> str:
        extractor = _HTMLTextExtractor()
        extractor.feed(html_content)
        extractor.close()
        cleaned_text = unescape(extractor.get_text())
        return " ".join(cleaned_text.split())

    def _build_prompt(
            self, 
            session_id: UUID, 
            document_id: UUID, 
            message: str, 
            db: Session,
            storage: StorageService
    ) -> ContentUnionDict:
        """Build the prompt for the chatbot based on the document content and user message."""
        messages = (
            db.query(ChatMessage)
                .filter(ChatMessage.session_id == session_id)
                .order_by(ChatMessage.created_at)
                .all()
        )

        if not messages:
            system_message = ChatMessage(
                session_id=session_id,
                role=ChatMessageRole.SYSTEM,
                content="You are a helpful assistant that provides information based on the provided document content. Use the document content to answer the user's question as accurately as possible."
            )
            db.add(system_message)
            db.commit()
            messages.append(system_message)

        user_message = ChatMessage(
            session_id=session_id,
            role=ChatMessageRole.USER,
            content=message
        )
        db.add(user_message)
        db.commit()

        messages.append(user_message)

        document_raw = storage.read_file(document_id, self.__DEFAULT_FILE_NAME)
        document_content = self._strip_html(document_raw)

        prompt_parts = [
            Part(
                text=f"Document content:\n{document_content}",
                role=ChatMessageRole.SYSTEM.value,
            ),
        ]

        prompt_parts.extend(
            Part(
                text=chat_message.content,
                role=chat_message.role.value,
            )
            for chat_message in messages
        )

        return prompt_parts

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
        
        contents = self._build_prompt(
            session_id=session.id,
            document_id=session.document_id,
            message=request.message,
            db=db,
            storage=storage
        )
        
        genai.models.generate_content(
            model=self.settings.gemini_model,
            contents=contents
        )
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
                ChatMessage.role.in_((ChatMessageRole.USER.value, ChatMessageRole.ASSISTANT.value)),
            )
            .order_by(ChatMessage.created_at)
            .all()
        )

        return GetSessionResponse(
            document_id=session.document_id,
            created_at=session.started_at,
            messages=[
                SessionMessage(
                    role=ChatMessageRole(message.role),
                    content=message.content,
                    created_at=message.created_at
                )
                for message in session_messages
            ]
        )