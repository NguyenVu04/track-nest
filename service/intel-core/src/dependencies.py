from src.configuration.storage.setup import (
    get_criminal_reports_client,
    get_user_tracking_client,
)
from src.configuration.storage.storage_service import StorageService
from src.domain.chatbot.chatbot_service import ChatbotService
from src.domain.chatbot.chatbot_service_impl import ChatbotServiceImpl
from src.util.settings import get_settings


def get_chatbot_service() -> ChatbotService:
    return ChatbotServiceImpl()


def get_criminal_reports_storage() -> StorageService:
    settings = get_settings()
    return StorageService(
        bucket=settings.s3_criminalreports_bucket_name,
        client=get_criminal_reports_client(),
    )


def get_user_tracking_storage() -> StorageService:
    settings = get_settings()
    return StorageService(
        bucket=settings.s3_usertracking_bucket_name,
        client=get_user_tracking_client(),
    )
