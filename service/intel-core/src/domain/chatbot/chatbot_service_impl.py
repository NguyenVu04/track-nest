from __future__ import annotations

import datetime
from html import unescape
from html.parser import HTMLParser
from google.genai import Client
from google.genai.types import ContentUnionDict, Content, Part
from uuid import UUID, uuid4

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
from src.util.exceptions import (
    BadRequestException, 
    NotFoundException, 
    ServiceUnavailableException
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
    __MESSAGE_LIMIT = 15
    __SYSTEM_PROMPT = """
                You are a professional historical assistant.

                Your task is to answer questions strictly based on the provided document content. 
                Always prioritize accuracy, factual correctness, and historical context.

                Guidelines:
                - Use only the information explicitly available in the document. Do not speculate or fabricate.
                - If the document lacks sufficient or relevant information, clearly state that you do not have enough information to answer.
                - Match the language, tone, and style of the user's question.
                - Provide structured, clear, and concise explanations using historically appropriate terminology.
                - Include relevant context such as time period, key figures, and significance when available.

                Length constraint:
                - Keep the answer concise and within 100–150 words (or approximately 80–120 tokens).
                - Avoid unnecessary elaboration, repetition, or filler content.

                Refusal rule:
                - If the answer cannot be derived from the document, respond with:
                "I do not have enough information in the provided document to answer this question."

                Do not use external knowledge under any circumstances.
                """
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
                role=ChatMessageRole.USER,
                content=self.__SYSTEM_PROMPT,
            )
            db.add(system_message)
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

        prompt_parts = [Content(
            parts=[
                Part(
                    text=f"Document content:\n{document_content}",
                )
            ],
            role=ChatMessageRole.USER.value,
        )]

        prompt_parts.extend(
            [
                Content(
                    parts=[Part(text=chat_message.content)],
                    role=ChatMessageRole(chat_message.role).value
                )
                for chat_message in messages
            ]
        )

        return prompt_parts

    def _ensure_document_exists(self, document_id: UUID, storage: StorageService) -> None:
        if not storage.file_exists(document_id, self.__DEFAULT_FILE_NAME):
            raise NotFoundException(
                f"Document with ID {document_id} does not exist in storage."
            )

    def _get_user_session_for_update(
        self,
        user_id: UUID,
        session_id: UUID,
        db: Session,
    ) -> ChatSession:
        session = (
            db
            .query(ChatSession)
            .filter_by(id=session_id, user_id=user_id)
            .with_for_update(nowait=True)
            .first()
        )
        if not session:
            raise NotFoundException(
                f"Session with ID {session_id} not found for user {user_id}."
            )
        return session

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
        self._ensure_document_exists(request.document_id, storage)

        session = ChatSession(
            user_id=user_id,
            id=uuid4(),
            document_id=request.document_id,
            started_at=datetime.datetime.now(),
            message_left=self.__MESSAGE_LIMIT
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
        session = self._get_user_session_for_update(
            user_id=user_id,
            session_id=request.session_id,
            db=db,
        )

        if session.message_left <= 0:
            raise BadRequestException("Message limit reached for this session.")
        self._ensure_document_exists(session.document_id, storage)
        
        contents = self._build_prompt(
            session_id=session.id,
            document_id=session.document_id,
            message=request.message,
            db=db,
            storage=storage
        )
        
        response_text = genai.models.generate_content(
            model=self.settings.gemini_model,
            contents=contents
        ).text

        if not response_text:
            raise ServiceUnavailableException("Failed to generate a response from the model.")

        session.message_left -= 1
        db.add(session)

        message = ChatMessage(
            session_id=session.id,
            role=ChatMessageRole.MODEL,
            content=response_text.strip(),
        )
        db.add(message)

        db.commit()

        return PostMessageResponse(
            response=response_text.strip() if response_text else "", 
            created_at=datetime.datetime.now()
        )
    
    async def retrieve_session(
            self, 
            user_id: UUID, 
            session_id: UUID, 
            db: Session
    ) -> GetSessionResponse:
        """Retrieve the details of a chatbot session."""
        session = db.query(ChatSession).filter_by(id=session_id, user_id=user_id).first()
        if not session:
            raise NotFoundException(f"Session with ID {session_id} not found for user {user_id}.")
        
        session_messages = (
            db.query(ChatMessage)
            .filter(
                ChatMessage.session_id == session_id,
                ChatMessage.role.in_((ChatMessageRole.USER.value, ChatMessageRole.MODEL.value)),
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
            ],
            message_left=session.message_left
        )