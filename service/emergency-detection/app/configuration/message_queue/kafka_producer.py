from aiokafka import AIOKafkaProducer
from settings import settings
import json
import asyncio

producer: AIOKafkaProducer | None = None

async def start_producer():
    global producer

    for i in range(10):  # retry 10 times
        try:
            producer = AIOKafkaProducer(
                bootstrap_servers=settings.kafka_bootstrap_servers,
                value_serializer=lambda v: json.dumps(v).encode("utf-8")
            )
            await producer.start()
            print("✅ Kafka connected")
            return
        except Exception as e:
            print(f"Kafka not ready, retry {i+1}/10: {e}")
            await asyncio.sleep(3)

    raise RuntimeError("❌ Kafka not available after retries")


async def stop_producer():
    await producer.stop()


async def send_event(topic: str, data: dict):
    await producer.send_and_wait(
        topic,
        json.dumps(data).encode("utf-8")
    )