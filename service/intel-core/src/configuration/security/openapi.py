from __future__ import annotations

from typing import Any

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi


def configure_bearer_auth_openapi(app: FastAPI) -> None:
    def custom_openapi() -> dict[str, Any]:
        if app.openapi_schema:
            return app.openapi_schema

        openapi_schema: dict[str, Any] = get_openapi(
            title=app.title,
            version=app.version,
            description=app.description,
            routes=app.routes,
        )
        components: dict[str, Any] = openapi_schema.setdefault("components", {})
        security_schemes: dict[str, Any] = components.setdefault(
            "securitySchemes",
            {},
        )
        security_schemes["bearerAuth"] = {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Paste a Keycloak access token. Swagger UI will send it as Authorization: Bearer <token>.",
        }
        openapi_schema["security"] = [{"bearerAuth": []}]

        app.openapi_schema = openapi_schema
        return app.openapi_schema

    setattr(app, "openapi", custom_openapi)
