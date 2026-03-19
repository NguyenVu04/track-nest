from aiokafka import AIOKafkaProducer
from settings import settings
import json

producer: AIOKafkaProducer | None = None

async def start_producer():
    global producer
    producer = AIOKafkaProducer(
        bootstrap_servers=settings.kafka_bootstrap_servers
    )
    await producer.start()


async def stop_producer():
    await producer.stop()


async def send_event(topic: str, data: dict):
    await producer.send_and_wait(
        topic,
        json.dumps(data).encode("utf-8")
    )