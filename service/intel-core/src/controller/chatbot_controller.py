from __future__ import annotations

from io import BytesIO
from fastapi import APIRouter, Depends, File, UploadFile
from uuid import UUID

from google.genai import Client

from sqlalchemy.orm import Session

from src.configuration.database.setup import get_db
from src.configuration.gemini.setup import get_gemini_client
from src.configuration.storage.storage_service import StorageService
from src.dependencies import get_chatbot_service, get_storage_service
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
    db: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage_service)
) -> PostSessionResponse:
    """
    Start a new chatbot session for the authenticated user.
    """
    session_info = await service.start_session(
        UUID(user.subject), 
        request, 
        db,
        storage
    )
    return session_info

@router.post("/message")
async def send_message(
    message: PostMessageRequest,
    user: AuthenticatedUser = Depends(require_current_user),
    service: ChatbotService = Depends(get_chatbot_service),
    db: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage_service),
    genai: Client = Depends(get_gemini_client)
) -> PostMessageResponse:
    """
    Send a message to the chatbot and receive a response.
    """
    response = await service.send_message(
        UUID(user.subject), 
        message, 
        db,
        storage,
        genai
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

@router.post("/file/upload")
async def upload_file(
    file: UploadFile = File(...),
    user: AuthenticatedUser = Depends(require_current_user),
    storage: StorageService = Depends(get_storage_service),
) -> dict:
    """
    Endpoint to handle file uploads for chatbot sessions.
    
    Args:
        document_id: UUID of the document associated with this file upload
        file: The file to upload
        user: Authenticated user making the request
        storage: Storage service for persisting the file
    
    Returns:
        Dictionary with upload metadata (key, bucket, file_name)
    """
    document_id = UUID(user.subject)  # Using user ID as document ID for simplicity
    file_content = await file.read()
    file_obj = BytesIO(file_content)
    key = storage.upload_file(
        file_obj,
        document_id,
        file.filename or "index.html",
        file.content_type or "application/octet-stream",
    )
    return {
        "key": key,
        "bucket": storage.bucket,
        "file_name": file.filename,
        "document_id": str(document_id),
    }