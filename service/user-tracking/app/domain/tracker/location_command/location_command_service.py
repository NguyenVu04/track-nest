from app.domain.tracker.location_command.dto.location_message import LocationMessage

from abc import ABC, abstractmethod
from datetime import datetime
from uuid import UUID

class LocationCommandService(ABC):

    @abstractmethod
    async def update_location(self, user_id: UUID, message: LocationMessage) -> None:
        pass