from __future__ import annotations

import logging
from dataclasses import dataclass, field
from types import TracebackType
from typing import Any, Mapping, cast

from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError, ResponseValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

from src.util.logging import get_correlation_id, get_logger

logger: logging.Logger = get_logger(__name__)


DEFAULT_ERROR_CODE: str = "INTERNAL_SERVER_ERROR"
DEFAULT_ERROR_MESSAGE: str = "Internal server error"


@dataclass(slots=True)
class AppException(Exception):
    message: str
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    code: str = DEFAULT_ERROR_CODE
    details: Any | None = None
    headers: Mapping[str, str] | None = field(default=None)

    def __post_init__(self) -> None:
        Exception.__init__(self, self.message)


class BadRequestException(AppException):
    def __init__(
        self,
        message: str = "Bad request",
        *,
        code: str = "BAD_REQUEST",
        details: Any | None = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            code=code,
            details=details,
        )


class NotFoundException(AppException):
    def __init__(
        self,
        message: str = "Resource not found",
        *,
        code: str = "NOT_FOUND",
        details: Any | None = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            code=code,
            details=details,
        )


class ConflictException(AppException):
    def __init__(
        self,
        message: str = "Conflict",
        *,
        code: str = "CONFLICT",
        details: Any | None = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            code=code,
            details=details,
        )


class UnauthorizedException(AppException):
    def __init__(
        self,
        message: str = "Unauthorized",
        *,
        code: str = "UNAUTHORIZED",
        details: Any | None = None,
        headers: Mapping[str, str] | None = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            code=code,
            details=details,
            headers=headers,
        )


class ForbiddenException(AppException):
    def __init__(
        self,
        message: str = "Forbidden",
        *,
        code: str = "FORBIDDEN",
        details: Any | None = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            code=code,
            details=details,
        )


class ServiceUnavailableException(AppException):
    def __init__(
        self,
        message: str = "Service unavailable",
        *,
        code: str = "SERVICE_UNAVAILABLE",
        details: Any | None = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            code=code,
            details=details,
        )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(
        RequestValidationError, request_validation_exception_handler
    )
    app.add_exception_handler(
        ResponseValidationError, response_validation_exception_handler
    )
    app.add_exception_handler(ValidationError, validation_exception_handler)
    app.add_exception_handler(SQLAlchemyError, database_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)


async def app_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    app_exc: AppException = cast(AppException, exc)
    if app_exc.status_code >= status.HTTP_500_INTERNAL_SERVER_ERROR:
        logger.exception(
            "Application exception occurred",
            extra={"error_code": app_exc.code, "path": str(request.url.path)},
            exc_info=_exc_info(exc),
        )
    else:
        logger.warning(
            "Application exception occurred: %s",
            app_exc.message,
            extra={"error_code": app_exc.code, "path": str(request.url.path)},
        )

    return _error_response(
        request=request,
        status_code=app_exc.status_code,
        code=app_exc.code,
        message=app_exc.message,
        details=app_exc.details,
        headers=app_exc.headers,
    )


async def http_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    http_exc: StarletteHTTPException = cast(StarletteHTTPException, exc)
    code: str
    message: str
    details: Any | None
    code, message, details = _parse_http_detail(
        http_exc.detail,
        http_exc.status_code,
    )

    if http_exc.status_code >= status.HTTP_500_INTERNAL_SERVER_ERROR:
        logger.exception(
            "HTTP exception occurred",
            extra={"error_code": code, "path": str(request.url.path)},
            exc_info=_exc_info(exc),
        )
    else:
        logger.warning(
            "HTTP exception occurred: %s",
            message,
            extra={"error_code": code, "path": str(request.url.path)},
        )

    return _error_response(
        request=request,
        status_code=http_exc.status_code,
        code=code,
        message=message,
        details=details,
        headers=http_exc.headers,
    )


async def request_validation_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    validation_exc: RequestValidationError = cast(RequestValidationError, exc)
    logger.warning(
        "Request validation failed",
        extra={"error_code": "REQUEST_VALIDATION_ERROR", "path": str(request.url.path)},
    )

    return _error_response(
        request=request,
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        code="REQUEST_VALIDATION_ERROR",
        message="Request validation failed",
        details=validation_exc.errors(),
    )


async def validation_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    logger.exception(
        "Data validation failed",
        extra={"error_code": "VALIDATION_ERROR", "path": str(request.url.path)},
        exc_info=_exc_info(exc),
    )

    return _error_response(
        request=request,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        code="VALIDATION_ERROR",
        message=DEFAULT_ERROR_MESSAGE,
    )


async def response_validation_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    logger.exception(
        "Response validation failed",
        extra={
            "error_code": "RESPONSE_VALIDATION_ERROR",
            "path": str(request.url.path),
        },
        exc_info=_exc_info(exc),
    )

    return _error_response(
        request=request,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        code="RESPONSE_VALIDATION_ERROR",
        message=DEFAULT_ERROR_MESSAGE,
    )


async def database_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception(
        "Database exception occurred",
        extra={"error_code": "DATABASE_ERROR", "path": str(request.url.path)},
        exc_info=_exc_info(exc),
    )

    return _error_response(
        request=request,
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        code="DATABASE_ERROR",
        message="Database service unavailable",
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception(
        "Unhandled exception occurred",
        extra={"error_code": DEFAULT_ERROR_CODE, "path": str(request.url.path)},
        exc_info=_exc_info(exc),
    )

    return _error_response(
        request=request,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        code=DEFAULT_ERROR_CODE,
        message=DEFAULT_ERROR_MESSAGE,
    )


def _error_response(
    *,
    request: Request,
    status_code: int,
    code: str,
    message: str,
    details: Any | None = None,
    headers: Mapping[str, str] | None = None,
) -> JSONResponse:
    correlation_id: str | None = get_correlation_id() or request.headers.get(
        "X-Correlation-ID"
    )

    payload: dict[str, Any] = {
        "error": {
            "code": code,
            "message": message,
            "correlation_id": correlation_id,
            "path": request.url.path,
        }
    }

    if details is not None:
        payload["error"]["details"] = details

    response_headers: dict[str, str] = dict(headers or {})
    if correlation_id:
        response_headers["X-Correlation-ID"] = correlation_id

    return JSONResponse(
        status_code=status_code,
        content=jsonable_encoder(payload),
        headers=response_headers,
    )


def _parse_http_detail(
    detail: Any,
    status_code: int,
) -> tuple[str, str, Any | None]:
    fallback_code: str = _status_code_to_error_code(status_code)

    if isinstance(detail, Mapping):
        detail_dict: dict[str, Any] = dict(detail)
        code: str = str(detail_dict.get("code", fallback_code) or fallback_code)
        message: str = str(
            detail_dict.get("message") or detail_dict.get("error") or fallback_code
        )
        details: Any | None = detail_dict.get("details")
        return code, message, details

    if detail:
        return fallback_code, str(detail), None

    return fallback_code, fallback_code.replace("_", " ").capitalize(), None


def _status_code_to_error_code(status_code: int) -> str:
    status_code_to_error_code: dict[int, str] = {
        status.HTTP_400_BAD_REQUEST: "BAD_REQUEST",
        status.HTTP_401_UNAUTHORIZED: "UNAUTHORIZED",
        status.HTTP_403_FORBIDDEN: "FORBIDDEN",
        status.HTTP_404_NOT_FOUND: "NOT_FOUND",
        status.HTTP_405_METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
        status.HTTP_409_CONFLICT: "CONFLICT",
        status.HTTP_422_UNPROCESSABLE_ENTITY: "UNPROCESSABLE_ENTITY",
        status.HTTP_429_TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
        status.HTTP_500_INTERNAL_SERVER_ERROR: DEFAULT_ERROR_CODE,
        status.HTTP_503_SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
    }
    return status_code_to_error_code.get(status_code, f"HTTP_{status_code}")


def _exc_info(
    exc: BaseException,
) -> tuple[type[BaseException], BaseException, TracebackType | None]:
    return (type(exc), exc, exc.__traceback__)
