from typing import Callable, Awaitable
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response

from .util import (
    Settings,
    get_correlation_id,
    register_exception_handlers,
    setup_logging,
    set_correlation_id,
)
from .util import get_settings
from .configuration import dispose_database
from .configuration.security import configure_bearer_auth_openapi, keycloak_user_filter

settings: Settings = get_settings()
setup_logging(settings.log_level)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    dispose_database()


app: FastAPI = FastAPI(
    lifespan=lifespan,
    swagger_ui_parameters={"persistAuthorization": True},
)
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

@app.get("/")
def read_root():
    return {"message": "Hello World"}
