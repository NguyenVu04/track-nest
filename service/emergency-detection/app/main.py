from contextlib import asynccontextmanager

from fastapi import FastAPI

from configuration.cache.redis_client import redis_client
from configuration.database.postgresql import engine
from configuration.message_queue.kafka_producer import start_producer, stop_producer, send_event, producer
from configuration.security.security_middleware import SecurityMiddleware
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

main = FastAPI(lifespan=lifespan)
main.add_middleware(SecurityMiddleware)
main.include_router(poi_manager_controller)
