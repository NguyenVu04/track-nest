from abc import ABC, abstractmethod

from core.location import Location

class LocationCommandRepository(ABC):
    @abstractmethod
    async def insert_location(self, location: Location) -> None:
        pass