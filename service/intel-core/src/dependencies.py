from src.domain.chatbot.chatbot_service import ChatbotService
from src.domain.chatbot.chatbot_service_impl import ChatbotServiceImpl
from src.configuration.storage.storage_service import StorageService

def get_chatbot_service() -> ChatbotService:
    """Dependency function to get an instance of ChatbotService."""
    return ChatbotServiceImpl()


def get_storage_service() -> StorageService:
    """Dependency function to get an instance of StorageService."""
    return StorageService()