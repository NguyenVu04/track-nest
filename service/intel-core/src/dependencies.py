from src.domain.chatbot.chatbot_service import ChatbotService
from src.domain.chatbot.chatbot_service_impl import ChatbotServiceImpl

def get_chatbot_service() -> ChatbotService:
    """Dependency function to get an instance of ChatbotService."""
    return ChatbotServiceImpl()