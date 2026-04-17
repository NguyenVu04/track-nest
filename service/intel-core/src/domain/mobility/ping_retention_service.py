from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import text
from sqlalchemy.engine import CursorResult

from src.configuration.celery.setup import celery_app
from src.configuration.database.setup import SessionLocal
from src.util.logging import get_logger
from src.util.settings import get_settings

logger = get_logger(__name__)

_CHUNK = 10_000


@celery_app.task(name="src.domain.mobility.ping_retention_service.run_ping_retention")
def run_ping_retention() -> dict:
    settings = get_settings()
    cutoff = datetime.now(timezone.utc) - timedelta(days=settings.mobility_ping_retention_days)
    deleted = 0
    while True:
        db = SessionLocal()
        try:
            result: CursorResult = db.execute(  # type: ignore[assignment]
                text(
                    """
                    DELETE FROM location_ping
                    WHERE id IN (
                        SELECT id FROM location_ping
                        WHERE event_ts < :cutoff
                        LIMIT :chunk
                    )
                    """
                ),
                {"cutoff": cutoff, "chunk": _CHUNK},
            )
            db.commit()
            rowcount = result.rowcount or 0
            deleted += rowcount
            if rowcount < _CHUNK:
                break
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()
    logger.info("Ping retention cycle complete", extra={"deleted": deleted})
    return {"deleted": deleted}
