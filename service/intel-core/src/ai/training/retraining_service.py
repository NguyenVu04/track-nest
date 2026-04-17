from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import text

from src.ai.inference.redis_cache import drift_cooldown_key
from src.ai.training.user_retrainer import UserRetrainer
from src.configuration.celery.setup import celery_app
from src.configuration.database.setup import SessionLocal
from src.configuration.redis.setup import get_sync_redis_client
from src.util.logging import get_logger
from src.util.settings import get_settings

logger = get_logger(__name__)


@celery_app.task(name="src.ai.training.retraining_service.run_full_refit_all_users")
def run_full_refit_all_users() -> dict:
    settings = get_settings()
    since = datetime.now(timezone.utc) - timedelta(days=settings.mobility_training_window_days)
    db = SessionLocal()
    try:
        rows = db.execute(
            text(
                "SELECT DISTINCT user_id FROM location_ping WHERE event_ts >= :since"
            ),
            {"since": since},
        ).fetchall()
    finally:
        db.close()

    count = 0
    for (user_id,) in rows:
        run_user_refit.delay(str(user_id), "full")
        count += 1
    logger.info("Scheduled full refits", extra={"users": count})
    return {"scheduled": count}


@celery_app.task(name="src.ai.training.retraining_service.run_warm_refit_active_users")
def run_warm_refit_active_users() -> dict:
    since = datetime.now(timezone.utc) - timedelta(days=1)
    db = SessionLocal()
    try:
        rows = db.execute(
            text("SELECT DISTINCT user_id FROM location_ping WHERE event_ts >= :since"),
            {"since": since},
        ).fetchall()
    finally:
        db.close()

    count = 0
    for (user_id,) in rows:
        run_user_refit.delay(str(user_id), "warm")
        count += 1
    logger.info("Scheduled warm refits", extra={"users": count})
    return {"scheduled": count}


@celery_app.task(name="src.ai.training.retraining_service.run_user_refit")
def run_user_refit(user_id_str: str, kind: str) -> dict:
    user_id = UUID(user_id_str)
    retrainer = UserRetrainer()
    result = retrainer.retrain_user(user_id, kind)
    return {"user_id": user_id_str, "kind": kind, **result}


@celery_app.task(name="src.ai.training.retraining_service.run_drift_refit")
def run_drift_refit(user_id_str: str) -> dict:
    """Drift-triggered refit, honours a cooldown to prevent thrashing."""
    settings = get_settings()
    user_id = UUID(user_id_str)
    redis = get_sync_redis_client()
    cooldown_key = drift_cooldown_key(user_id)
    if redis.get(cooldown_key):
        logger.info("Drift refit suppressed by cooldown", extra={"user_id": user_id_str})
        return {"user_id": user_id_str, "cooldown_active": True}
    redis.set(
        cooldown_key,
        b"1",
        ex=settings.mobility_drift_refit_cooldown_hours * 3600,
    )
    retrainer = UserRetrainer(settings)
    result = retrainer.retrain_user(user_id, "drift")
    return {"user_id": user_id_str, "kind": "drift", **result}
