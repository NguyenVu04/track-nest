from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone

import redis.asyncio as aioredis
from sqlalchemy import text

from src.configuration.database.setup import SessionLocal
from src.util.logging import get_logger
from src.util.settings import Settings

logger: logging.Logger = get_logger(__name__)

_LOCK_KEY = "intel-core:session-cleanup"


class SessionCleanupService:
    def __init__(self, redis_client: aioredis.Redis, settings: Settings) -> None:
        self._redis = redis_client
        self._settings = settings

    async def start(self) -> None:
        logger.info("SessionCleanupService started")
        try:
            while True:
                try:
                    await self._run_cycle()
                except Exception as exc:
                    logger.error("Cleanup cycle failed", extra={"error": str(exc)})
                await asyncio.sleep(self._settings.cleanup_interval_hours * 3600)
        except asyncio.CancelledError:
            pass
        finally:
            logger.info("SessionCleanupService stopped")

    async def _run_cycle(self) -> None:
        acquired = await self._redis.set(
            _LOCK_KEY,
            "1",
            nx=True,
            ex=self._settings.cleanup_interval_hours * 3600,
        )
        if not acquired:
            logger.info("Cleanup skipped — lock held by another instance")
            return

        loop = asyncio.get_event_loop()
        deleted = await loop.run_in_executor(None, self._delete_old_sessions)
        logger.info("Cleanup cycle complete", extra={"deleted_sessions": deleted})

    def _delete_old_sessions(self) -> int:
        """Synchronous — runs in thread-pool executor (SQLAlchemy is sync)."""
        cutoff = datetime.now(timezone.utc) - timedelta(
            days=self._settings.session_retention_days
        )
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
                return 0
            db.execute(
                text("DELETE FROM chat_message WHERE session_id = ANY(:ids)"),
                {"ids": old_ids},
            )
            db.execute(
                text("DELETE FROM chat_session WHERE id = ANY(:ids)"),
                {"ids": old_ids},
            )
            db.commit()
            return len(old_ids)
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()
