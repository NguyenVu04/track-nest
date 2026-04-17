from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING, Optional
from uuid import UUID

from botocore.exceptions import ClientError

from src.ai.inference import redis_cache
from src.ai.inference.gmm_scorer import GmmComponents
from src.ai.inference.projection import UserProjection
from src.configuration.storage.storage_service import StorageService
from src.util.logging import get_logger
from src.util.settings import Settings

if TYPE_CHECKING:
    import redis.asyncio as aioredis

logger = get_logger(__name__)


def bucket_s3_key(prefix: str, uid: UUID, hour: int, dow: int) -> str:
    return f"{prefix}{uid}/{hour}_{dow}.json"


def projection_s3_key(prefix: str, uid: UUID) -> str:
    return f"{prefix}{uid}/projection.json"


class ModelLoader:
    """Redis → S3 fallback loader for per-bucket model artifacts."""

    def __init__(
        self,
        redis: "aioredis.Redis",
        storage: StorageService,
        settings: Settings,
    ) -> None:
        self._redis = redis
        self._storage = storage
        self._settings = settings

    async def load_projection(self, uid: UUID) -> Optional[UserProjection]:
        cached = await redis_cache.get_projection(self._redis, uid)
        if cached is not None:
            return cached

        key = projection_s3_key(self._settings.mobility_model_s3_prefix, uid)
        try:
            raw = await asyncio.to_thread(self._storage.get_bytes, key)
        except ClientError:
            return None
        except Exception as exc:
            logger.warning("Failed to load projection from S3", extra={"user_id": str(uid), "error": str(exc)})
            return None

        proj = UserProjection.from_json(raw)
        await redis_cache.set_projection(self._redis, uid, proj)
        return proj

    async def load_bucket(
        self,
        uid: UUID,
        hour: int,
        dow: int,
    ) -> Optional[tuple[GmmComponents, float]]:
        comps = await redis_cache.get_components(self._redis, uid, hour, dow)
        thr = await redis_cache.get_threshold(self._redis, uid, hour, dow)
        if comps is not None and thr is not None:
            return comps, thr

        key = bucket_s3_key(self._settings.mobility_model_s3_prefix, uid, hour, dow)
        try:
            raw = await asyncio.to_thread(self._storage.get_bytes, key)
        except ClientError:
            return None
        except Exception as exc:
            logger.warning(
                "Failed to load bucket model from S3",
                extra={"user_id": str(uid), "hour": hour, "dow": dow, "error": str(exc)},
            )
            return None

        import orjson

        payload = orjson.loads(raw)
        comps = GmmComponents.from_arrays(
            weights=payload["weights"],
            means=payload["means"],
            covariances=payload["covariances"],
            scaler_mean=payload["scaler_mean"],
            scaler_std=payload["scaler_std"],
        )
        thr = float(payload["threshold"])
        await redis_cache.set_components(self._redis, uid, hour, dow, comps)
        await redis_cache.set_threshold(self._redis, uid, hour, dow, thr)
        return comps, thr
