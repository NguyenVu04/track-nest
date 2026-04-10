from __future__ import annotations

from typing import Protocol

class ChatbotService(Protocol):
    async def get_status(self) -> str:
        """Get the status of the chatbot."""
        ...