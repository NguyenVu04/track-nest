from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager, suppress
from typing import Callable, Awaitable

from fastapi import FastAPI, Request, Response
from prometheus_fastapi_instrumentator import Instrumentator

from src.ai.anomaly_detector import DpgmmAnomalyDetector
from src.configuration.database.setup import dispose_database
from src.configuration.kafka.setup import create_kafka_consumer, create_kafka_producer
from src.configuration.redis.setup import get_redis_client
from src.configuration.security.middleware import keycloak_user_filter
from src.configuration.security.openapi import configure_bearer_auth_openapi
from src.configuration.storage.setup import get_user_tracking_client
from src.configuration.storage.storage_service import StorageService
from src.controller.chatbot_controller import router as chatbot_router
from src.domain.mobility.mobility_monitor import MobilityMonitor
from src.domain.mobility.ping_writer import PingWriter
from src.util.exceptions import register_exception_handlers
from src.util.logging import get_correlation_id, set_correlation_id, setup_logging
from src.util.settings import Settings, get_settings

settings: Settings = get_settings()
setup_logging(settings.log_level)


@asynccontextmanager
async def lifespan(app: FastAPI):
    redis = get_redis_client()
    storage = StorageService(
        bucket=settings.s3_usertracking_bucket_name,
        client=get_user_tracking_client(),
    )
    ping_writer = PingWriter(
        flush_interval_s=settings.mobility_ping_flush_interval_s,
        batch_size=settings.mobility_ping_batch_size,
    )
    await ping_writer.start()

    detector = DpgmmAnomalyDetector(
        redis=redis,
        storage=storage,
        ping_writer=ping_writer,
        settings=settings,
    )
    monitor = MobilityMonitor(
        detector=detector,
        consumer=create_kafka_consumer(),
        producer=create_kafka_producer(),
    )

    monitor_task = asyncio.create_task(monitor.start())

    try:
        yield
    finally:
        monitor_task.cancel()
        with suppress(Exception, asyncio.CancelledError):
            await monitor_task
        await ping_writer.stop()
        dispose_database()

app: FastAPI = FastAPI(
    lifespan=lifespan,
    swagger_ui_parameters={"persistAuthorization": True},
    root_path="/intel-core",
)
Instrumentator().instrument(app).expose(app)
register_exception_handlers(app)
configure_bearer_auth_openapi(app)
app.middleware("http")(keycloak_user_filter)

@app.middleware("http")
async def add_correlation_id(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    cid: str | None = request.headers.get("X-Correlation-ID")
    set_correlation_id(cid)

    response: Response = await call_next(request)
    correlation_id: str = get_correlation_id() or ""
    response.headers["X-Correlation-ID"] = correlation_id
    return response

app.include_router(chatbot_router)