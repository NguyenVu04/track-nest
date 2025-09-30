import os

from fastapi import FastAPI
from aiokafka import AIOKafkaProducer
import uvicorn

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

# from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
# from sqlalchemy.orm import declarative_base

load_dotenv('.env')

# db_url = os.getenv('DATABASE_URL')
# engine = create_async_engine(db_url, echo=True)
# async_session = async_sessionmaker(engine, expire_on_commit=False)
KAFKA_SERVER = os.getenv('KAFKA_SERVER')
KAFKA_TOPIC = os.getenv('KAFKA_TOPIC')

async def main():
    app = FastAPI()

    producer = AIOKafkaProducer(bootstrap_servers=KAFKA_SERVER)
    await producer.start()

    app.include_router(voice_risk_detector_controller.router)
    app.include_router(notifier_controller.router)
    app.include_router(mobility_anomaly_detector_controller.router)
    app.include_router(tracking_manager_controller.router)
    app.include_router(location_risk_detector_controller.router)

    app.include_router(TrackingController(
        location_command_service=LocationCommandServiceImpl(),
        location_query_service=LocationQueryServiceImpl(),
        websocket_manager=LocationQueryWebSocketManager(),
    ).router)

    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()