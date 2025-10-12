from abc import ABC, abstractmethod
from uuid import UUID

from connection.message_content import MessageContent

class UserConnectionManager(ABC):
    @abstractmethod
    def send_message(self, user_id: UUID, topic: str, message: MessageContent) -> None:
        pass