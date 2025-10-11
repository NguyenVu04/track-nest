import os
import asyncio

from fastapi import FastAPI
from aiokafka import AIOKafkaProducer
import uvicorn
from kafka.admin import KafkaAdminClient, NewTopic
from kafka.errors import TopicAlreadyExistsError
from dotenv import load_dotenv

from app.controller import voice_risk_detector_controller
from app.controller import notifier_controller
from app.controller import mobility_anomaly_detector_controller
from app.controller import tracking_manager_controller
from app.controller import location_risk_detector_controller
from app.controller.tracking_controller import TrackingController

from app.domain.tracker.location_query.location_query_service_impl import LocationQueryServiceImpl
from app.domain.tracker.location_command.location_command_service_impl import LocationCommandServiceImpl
from app.domain.tracker.location_query.location_query_websocket_manager import LocationQueryWebSocketManager
from app.domain.tracker.location_query.location_message_consumer import LocationMessageConsumer

# from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
# from sqlalchemy.orm import declarative_base

load_dotenv('.env')

KAFKA_SERVER = os.getenv('KAFKA_SERVER')

TOPIC_NAME = "test-topic"

class AppState:
    producer: AIOKafkaProducer = None

app_state = AppState()

async def start_up():
    app_state.producer = AIOKafkaProducer(bootstrap_servers=KAFKA_SERVER)
    await app_state.producer.start()

    consumer = LocationMessageConsumer(
        bootstrap_servers=KAFKA_SERVER,
        location_query_service=LocationQueryServiceImpl()
    )
    await consumer.start()

def create_app():
    app = FastAPI()
    app.add_event_handler('startup', start_up)

    app.include_router(voice_risk_detector_controller.router)
    app.include_router(notifier_controller.router)
    app.include_router(mobility_anomaly_detector_controller.router)
    app.include_router(tracking_manager_controller.router)
    app.include_router(location_risk_detector_controller.router)

    app.include_router(TrackingController(
        location_command_service=LocationCommandServiceImpl(producer=app_state.producer),
        location_query_service=LocationQueryServiceImpl(),
        websocket_manager=LocationQueryWebSocketManager(),
    ).router)

    return app

def main():
    app = create_app()
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()