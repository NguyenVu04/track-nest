from __future__ import annotations

from functools import lru_cache

import redis.asyncio as aioredis

from src.util.settings import Settings, get_settings


def _validate_redis_settings(settings: Settings) -> None:
    if not settings.redis_url:
        raise RuntimeError("Redis is not configured. Missing setting: redis_url")


@lru_cache(maxsize=1)
def get_redis_client() -> aioredis.Redis:
    settings: Settings = get_settings()
    _validate_redis_settings(settings)
    return aioredis.from_url(settings.redis_url, decode_responses=False)
