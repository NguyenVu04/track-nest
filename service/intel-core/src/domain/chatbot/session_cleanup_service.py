from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import text

from src.configuration.celery.setup import celery_app
from src.configuration.database.setup import SessionLocal
from src.util.logging import get_logger
from src.util.settings import get_settings

logger: logging.Logger = get_logger(__name__)


@celery_app.task(name="src.domain.chatbot.session_cleanup_service.run_cleanup")
def run_cleanup() -> dict:
    settings = get_settings()
    cutoff = datetime.now(timezone.utc) - timedelta(days=settings.session_retention_days)
    db = SessionLocal()
    try:
        old_ids = [
            row[0]
            for row in db.execute(
                text("SELECT id FROM chat_session WHERE started_at < :cutoff"),
                {"cutoff": cutoff},
            ).fetchall()
        ]
        if not old_ids:
            logger.info("Cleanup cycle complete", extra={"deleted_sessions": 0})
            return {"deleted_sessions": 0}
        db.execute(
            text("DELETE FROM chat_message WHERE session_id = ANY(:ids)"),
            {"ids": old_ids},
        )
        db.execute(
            text("DELETE FROM chat_session WHERE id = ANY(:ids)"),
            {"ids": old_ids},
        )
        db.commit()
        deleted = len(old_ids)
        logger.info("Cleanup cycle complete", extra={"deleted_sessions": deleted})
        return {"deleted_sessions": deleted}
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
