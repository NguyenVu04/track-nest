from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

import numpy as np
import orjson

from src.ai.inference.model_loader import bucket_s3_key, projection_s3_key
from src.ai.inference.projection import UserProjection
from src.configuration.storage.storage_service import StorageService
from src.util.settings import Settings


class ArtifactWriter:
    """Writes per-user model JSON artifacts to the user-tracking S3 bucket."""

    def __init__(self, storage: StorageService, settings: Settings) -> None:
        self._storage = storage
        self._settings = settings

    def write_bucket(
        self,
        user_id: UUID,
        hour: int,
        dow: int,
        weights: np.ndarray,
        means: np.ndarray,
        covariances: np.ndarray,
        scaler_mean: np.ndarray,
        scaler_std: np.ndarray,
        threshold: float,
    ) -> str:
        key = bucket_s3_key(self._settings.mobility_model_s3_prefix, user_id, hour, dow)
        payload = orjson.dumps(
            {
                "weights": weights.tolist(),
                "means": means.tolist(),
                "covariances": covariances.tolist(),
                "scaler_mean": scaler_mean.tolist(),
                "scaler_std": scaler_std.tolist(),
                "threshold": float(threshold),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        self._storage.put_bytes(key, payload, content_type="application/json")
        return key

    def write_projection(self, user_id: UUID, projection: UserProjection) -> str:
        key = projection_s3_key(self._settings.mobility_model_s3_prefix, user_id)
        self._storage.put_bytes(key, projection.to_json(), content_type="application/json")
        return key
