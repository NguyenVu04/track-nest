from __future__ import annotations

from celery import Celery
from celery.schedules import crontab

from src.util.settings import get_settings

settings = get_settings()

celery_app = Celery(
    "intel-core",
    broker=settings.redis_url,
    include=[
        "src.domain.maintenance.session_cleanup_service",
        "src.ai.training.retraining_service",
        "src.ai.training.drift_scanner",
        "src.domain.mobility.maintenance.ping_retention_service",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_ignore_result=True,
    beat_schedule={
        "session-cleanup": {
            "task": "src.domain.maintenance.session_cleanup_service.run_cleanup",
            "schedule": crontab(
                hour=f"*/{settings.cleanup_interval_hours}"
                if settings.cleanup_interval_hours < 24
                else "0",
                minute="0",
            ),
        },
        "mobility-full-refit": {
            "task": "src.ai.training.retraining_service.run_full_refit_all_users",
            "schedule": crontab(minute=0, hour=3, day_of_week=0),
        },
        "mobility-warm-refit": {
            "task": "src.ai.training.retraining_service.run_warm_refit_active_users",
            "schedule": crontab(minute=30, hour=3),
        },
        "mobility-drift-scan": {
            "task": "src.ai.training.drift_scanner.run_drift_scan",
            "schedule": crontab(minute=0),
        },
        "mobility-ping-retention": {
            "task": "src.domain.mobility.maintenance.ping_retention_service.run_ping_retention",
            "schedule": crontab(minute=0, hour=4),
        },
    },
)
