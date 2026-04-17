from __future__ import annotations

from src.ai.training.retraining_service import run_drift_refit
from src.configuration.celery.setup import celery_app
from src.configuration.redis.setup import get_sync_redis_client
from src.util.logging import get_logger

logger = get_logger(__name__)

_FLAG_PATTERN = "mob:*:drift_flag"


@celery_app.task(name="src.ai.training.drift_scanner.run_drift_scan")
def run_drift_scan() -> dict:
    """SCAN all drift flags set by the inference hot path and enqueue refits.

    The flag keys look like ``mob:{user_id}:drift_flag``. We extract the UUID
    from the key, delete the flag, and hand off to ``run_drift_refit`` (which
    owns the cooldown logic).
    """
    redis = get_sync_redis_client()
    scheduled = 0
    for raw_key in redis.scan_iter(match=_FLAG_PATTERN, count=500):
        key = raw_key.decode("utf-8") if isinstance(raw_key, (bytes, bytearray)) else str(raw_key)
        parts = key.split(":")
        if len(parts) < 3:
            redis.delete(raw_key)
            continue
        user_id = parts[1]
        redis.delete(raw_key)
        run_drift_refit.delay(user_id)
        scheduled += 1
    logger.info("Drift scan complete", extra={"scheduled": scheduled})
    return {"scheduled": scheduled}
