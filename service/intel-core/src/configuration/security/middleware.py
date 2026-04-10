from __future__ import annotations

from collections.abc import Awaitable, Callable
from contextvars import Token
from typing import Any

from fastapi import Request, Response

from ...util import Settings, UnauthorizedException, get_settings
from ...util.auth import AuthenticatedUser, reset_current_auth, set_current_auth
from ...util.exceptions import AppException, app_exception_handler

from .jwt import decode_verified_jwt_claims, user_from_keycloak_claims


async def keycloak_user_filter(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    settings: Settings = get_settings()
    user_token: Token[AuthenticatedUser | None]
    bearer_token: Token[str | None]

    if request.method == "OPTIONS" or _is_exempt_path(
        request.url.path,
        settings.auth_exempt_paths,
    ):
        user_token, bearer_token = set_current_auth(None, None)
        try:
            request.state.user = None
            request.state.bearer_token = None
            return await call_next(request)
        finally:
            reset_current_auth(user_token, bearer_token)

    try:
        token: str | None = _extract_bearer_token(request)
    except AppException as exc:
        return await app_exception_handler(request, exc)

    if token is None:
        user_token, bearer_token = set_current_auth(None, None)
        try:
            request.state.user = None
            request.state.bearer_token = None
            return await call_next(request)
        finally:
            reset_current_auth(user_token, bearer_token)

    try:
        claims: dict[str, Any] = decode_verified_jwt_claims(token)
        user: AuthenticatedUser = user_from_keycloak_claims(claims)
    except AppException as exc:
        return await app_exception_handler(request, exc)

    user_token, bearer_token = set_current_auth(user, token)
    try:
        request.state.user = user
        request.state.bearer_token = token
        return await call_next(request)
    finally:
        reset_current_auth(user_token, bearer_token)


def _extract_bearer_token(request: Request) -> str | None:
    authorization: str | None = request.headers.get("Authorization")
    if authorization is None:
        return None

    scheme: str
    separator: str
    token: str
    scheme, separator, token = authorization.partition(" ")
    token = token.strip()
    if scheme.lower() != "bearer" or not separator or not token:
        raise UnauthorizedException(
            "Invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return token


def _is_exempt_path(path: str, raw_exempt_paths: str) -> bool:
    exempt_paths: set[str] = {
        exempt_path.strip()
        for exempt_path in raw_exempt_paths.split(",")
        if exempt_path.strip()
    }

    return path in exempt_paths
