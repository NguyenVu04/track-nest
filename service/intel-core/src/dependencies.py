from src.domain import (
    ChatbotService,
    ChatbotServiceImpl,
)

def get_chatbot_service() -> ChatbotService:
    """Dependency function to get an instance of ChatbotService."""
    return ChatbotServiceImpl()