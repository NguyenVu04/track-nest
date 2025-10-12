from abc import ABC, abstractmethod

class MessageContent(ABC):
    @abstractmethod
    def get_message_content(self) -> str:
        pass