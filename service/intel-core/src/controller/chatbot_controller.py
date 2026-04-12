from __future__ import annotations

from fastapi import APIRouter, Depends
from uuid import UUID

from sqlalchemy.orm import Session

from src.configuration.database.setup import get_db
from src.dependencies import get_chatbot_service
from src.domain.chatbot.chatbot_service import ChatbotService
from src.domain.chatbot.datatype.get_session_dto import GetSessionResponse
from src.domain.chatbot.datatype.post_message_dto import (
    PostMessageRequest,
    PostMessageResponse,
)
from src.domain.chatbot.datatype.post_session_dto import (
    PostSessionRequest,
    PostSessionResponse,
)
from src.util.auth import AuthenticatedUser, require_current_user

router = APIRouter(
    prefix="/chatbot", 
    tags=["chatbot"],
)

@router.get("/status")
async def get_chatbot_status(service: ChatbotService = Depends(get_chatbot_service)) -> dict:
    """
    Get the status of the chatbot.
    """
    status = await service.get_status()
    return {"status": status}

@router.post("/session")
async def start_chatbot_session(
    request: PostSessionRequest,
    user: AuthenticatedUser = Depends(require_current_user),
    service: ChatbotService = Depends(get_chatbot_service),
    db: Session = Depends(get_db)
) -> PostSessionResponse:
    """
    Start a new chatbot session for the authenticated user.
    """
    session_info = await service.start_session(
        UUID(user.subject), 
        request, 
        db
    )
    return session_info

@router.post("/message")
async def send_message(
    message: PostMessageRequest,
    user: AuthenticatedUser = Depends(require_current_user),
    service: ChatbotService = Depends(get_chatbot_service),
    db: Session = Depends(get_db)
) -> PostMessageResponse:
    """
    Send a message to the chatbot and receive a response.
    """
    response = await service.send_message(
        UUID(user.subject), 
        message, 
        db
    )
    return response

@router.get("/session/{session_id}")
async def retrieve_session(
    session_id: UUID,
    user: AuthenticatedUser = Depends(require_current_user),
    service: ChatbotService = Depends(get_chatbot_service),
    db: Session = Depends(get_db)
) -> GetSessionResponse:
    """
    Retrieve the details of a chatbot session.
    """
    session_details = await service.retrieve_session(
        UUID(user.subject), 
        session_id, 
        db
    )
    return session_details