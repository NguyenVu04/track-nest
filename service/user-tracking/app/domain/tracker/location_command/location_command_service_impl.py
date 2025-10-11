import asyncio

from app.domain.tracker.location_command.location_command_service import LocationCommandService
from app.domain.tracker.location_command.dto.location_message import LocationMessage
from app.domain.tracker.location_command.dto.post_location_dto import PostLocationDto

from uuid import UUID
from aiokafka import AIOKafkaProducer
from datetime import datetime

class LocationCommandServiceImpl(LocationCommandService):
    LOCATION_TOPIC = "user_location"
    _producer: AIOKafkaProducer

    def __init__(self, producer: AIOKafkaProducer):
        self._producer = producer

    async def update_location(self, user_id: UUID, location: PostLocationDto) -> None:
        location_message = LocationMessage(
            user_id=user_id,
            latitude=location.latitude,
            longitude=location.longitude,
            timestamp=location.timestamp,
            accuracy=location.accuracy,
        )

        message_coroutine = self._producer.send_and_wait(self.LOCATION_TOPIC, location_message.model_dump())
        asyncio.create_task(message_coroutine)