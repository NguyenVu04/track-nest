from abc import ABC, abstractmethod
from uuid import UUID

from domain.tracker.location_command.data_type.location_request import LocationRequest

class LocationCommandService(ABC):

    @abstractmethod
    def update_location(self, user_id: UUID, location: LocationRequest) -> None:
        pass