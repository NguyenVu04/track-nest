import logging
import sys
import json
import time
import uuid
from contextvars import ContextVar
from typing import Any

# Correlation ID (per request)
correlation_id: ContextVar[str | None] = ContextVar("correlation_id", default=None)


# ---------- JSON Formatter ----------
class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_record: dict[str, Any] = {
            "timestamp": int(time.time() * 1000),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "correlation_id": correlation_id.get(),
            "module": record.module,
            "funcName": record.funcName,
            "line": record.lineno,
        }

        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_record, ensure_ascii=False)


# ---------- Logger Setup ----------
def setup_logging(level: str = "INFO") -> None:
    log_level: int = getattr(logging, level.upper(), logging.INFO)

    handler: logging.StreamHandler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    logging.basicConfig(
        level=log_level,
        handlers=[handler],
    )

    # Reduce noisy libs
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


# ---------- Correlation ID Middleware ----------
def generate_correlation_id() -> str:
    return str(uuid.uuid4())


def set_correlation_id(cid: str | None = None) -> None:
    if not cid:
        cid = generate_correlation_id()
    correlation_id.set(cid)


def get_correlation_id() -> str | None:
    return correlation_id.get()


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
