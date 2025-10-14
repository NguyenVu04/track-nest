from aiokafka import AIOKafkaProducer
from uuid import UUID
from domain.tracker.location_command.data_type.location_request import LocationRequest

from domain.tracker.location_command.location_command_service import LocationCommandService
from domain.tracker.location_command.location_command_repository import LocationCommandRepository
from core.location import Location
from core.location_message import LocationMessage

class LocationCommandServiceImpl(LocationCommandService):
    location_repository: LocationCommandRepository
    message_producer: AIOKafkaProducer

    def __init__(self, location_repository: LocationCommandRepository, message_producer: AIOKafkaProducer):
        self.location_repository = location_repository
        self.message_producer = message_producer

    async def update_location(self, user_id: UUID, location: LocationRequest) -> None:
        location = Location(
            latitude=location.latitude,
            longitude=location.longitude,
            timestamp=location.timestamp,
            accuracy=location.accuracy
        )

        await self.location_repository.insert_location(location)

        location_message = LocationMessage(
            id=location.id,
            user_id=user_id,
            latitude=location.latitude,
            longitude=location.longitude,
            timestamp=location.timestamp,
            accuracy=location.accuracy
        )