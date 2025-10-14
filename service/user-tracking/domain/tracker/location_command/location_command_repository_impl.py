from sqlalchemy.ext.asyncio import AsyncSession

from core.location import Location
from domain.tracker.location_command.location_command_repository import LocationCommandRepository

class LocationCommandRepositoryImpl(LocationCommandRepository):
    session: AsyncSession

    def __init__(self, session: AsyncSession):
        self.session = session

    async def insert_location(self, location: Location) -> None:
        self.session.add(location)
        await self.session.commit()