from __future__ import annotations

from typing import Callable, Awaitable
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from prometheus_fastapi_instrumentator import Instrumentator

from src.configuration.database.setup import dispose_database
from src.configuration.security.middleware import keycloak_user_filter
from src.configuration.security.openapi import configure_bearer_auth_openapi
from src.controller.chatbot_controller import router as chatbot_router
from src.util.exceptions import register_exception_handlers
from src.util.logging import get_correlation_id, set_correlation_id, setup_logging
from src.util.settings import Settings, get_settings

settings: Settings = get_settings()
setup_logging(settings.log_level)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
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