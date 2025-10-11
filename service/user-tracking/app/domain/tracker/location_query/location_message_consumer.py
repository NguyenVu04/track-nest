import asyncio

from app.domain.tracker.location_query.location_query_service import LocationQueryService

from aiokafka import AIOKafkaConsumer

class LocationMessageConsumer:
    GROUP_ID = 'user_tracking'
    LOCATION_TOPIC = 'test-topic'

    _consumer: AIOKafkaConsumer
    _location_query_service: LocationQueryService

    def __init__(
            self,
            bootstrap_servers: str,
            location_query_service: LocationQueryService
    ):
        self._consumer = AIOKafkaConsumer(
            self.LOCATION_TOPIC,
            bootstrap_servers=bootstrap_servers,
            group_id=self.GROUP_ID,
        )
        self._location_query_service = location_query_service

    async def consume(self):
        await self._consumer.start()
        try:
            async for message in self._consumer:
                print(message.value) #TODO: For debugging purposes
        finally:
            await self._consumer.stop()

    async def start(self):
        asyncio.create_task(self.consume())