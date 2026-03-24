from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.params import Depends

from configuration.cache.redis_client import redis_client
from configuration.database.database_config import engine
from configuration.message_queue.kafka_producer import start_producer, stop_producer, send_event, producer
from configuration.security.logging_config import setup_logging
from configuration.security.security_middleware import SecurityMiddleware
from configuration.security.security_utils import get_token
from controller.poi_manager_controller import router as poi_manager_controller


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- startup ---
    await start_producer()
    await redis_client.ping()

    async with engine.begin() as conn:
        await conn.run_sync(lambda _: None)

    # store shared resources
    app.state.kafka = producer
    app.state.redis = redis_client

    yield

    # --- shutdown ---
    await stop_producer()
    await redis_client.close()
    await engine.dispose()


setup_logging()

main = FastAPI(
    lifespan=lifespan,
    title="Emergency Detection Service API",
    description="API for managing Points of Interest (POIs) related to emergency detection and response.",
    dependencies=[Depends(get_token)],
)

main.add_middleware(SecurityMiddleware)

API_PREFIX = "/api/v1"
main.include_router(poi_manager_controller, prefix=API_PREFIX)

@main.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
