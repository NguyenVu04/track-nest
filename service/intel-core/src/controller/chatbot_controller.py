from __future__ import annotations

from fastapi import APIRouter, Depends

from src.dependencies import get_chatbot_service
from src.domain import ChatbotService

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