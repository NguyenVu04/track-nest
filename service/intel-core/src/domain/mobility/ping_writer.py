from __future__ import annotations

import asyncio
from typing import Any

from sqlalchemy.dialects.postgresql import insert

from src.configuration.database.setup import SessionLocal
from src.core.entity.location_ping import LocationPing
from src.util.logging import get_logger

logger = get_logger(__name__)


class PingWriter:
    """Buffered async writer for location_ping rows.

    submit() is non-blocking (drop-on-full). A background flush task bulk-inserts
    batched rows via SessionLocal on a thread so the event loop stays free.
    """

    def __init__(
        self,
        flush_interval_s: float = 1.0,
        batch_size: int = 200,
        queue_size: int = 10_000,
    ) -> None:
        self._flush_interval_s = flush_interval_s
        self._batch_size = batch_size
        self._queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=queue_size)
        self._task: asyncio.Task[None] | None = None
        self._stopping = asyncio.Event()
        self._dropped = 0

    async def start(self) -> None:
        if self._task is None:
            self._stopping.clear()
            self._task = asyncio.create_task(self._flush_loop(), name="ping-writer")

    async def stop(self) -> None:
        self._stopping.set()
        if self._task is not None:
            try:
                await asyncio.wait_for(self._task, timeout=5.0)
            except asyncio.TimeoutError:
                self._task.cancel()
            self._task = None

    def submit(self, row: dict[str, Any]) -> None:
        try:
            self._queue.put_nowait(row)
        except asyncio.QueueFull:
            self._dropped += 1
            if self._dropped % 100 == 1:
                logger.warning("PingWriter queue full — dropped pings", extra={"total_dropped": self._dropped})

    async def _flush_loop(self) -> None:
        while True:
            batch = await self._drain_batch()
            if batch:
                try:
                    await asyncio.to_thread(self._bulk_insert, batch)
                except Exception as exc:
                    logger.error("PingWriter bulk insert failed", extra={"error": str(exc), "count": len(batch)})
            elif self._stopping.is_set():
                return

    async def _drain_batch(self) -> list[dict[str, Any]]:
        batch: list[dict[str, Any]] = []
        try:
            first = await asyncio.wait_for(self._queue.get(), timeout=self._flush_interval_s)
        except asyncio.TimeoutError:
            return batch
        batch.append(first)
        while len(batch) < self._batch_size:
            try:
                batch.append(self._queue.get_nowait())
            except asyncio.QueueEmpty:
                break
        return batch

    @staticmethod
    def _bulk_insert(rows: list[dict[str, Any]]) -> None:
        db = SessionLocal()
        try:
            db.execute(insert(LocationPing), rows)
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()
