from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Protocol, runtime_checkable

import numpy as np

from src.ai.inference import cusum as cusum_mod
from src.ai.inference import kalman, redis_cache
from src.ai.inference.gmm_scorer import log_likelihood, scale
from src.ai.inference.model_loader import ModelLoader
from src.configuration.storage.storage_service import StorageService
from src.domain.mobility.location_message import LocationMessage
from src.domain.mobility.ping_writer import PingWriter
from src.util.logging import get_logger
from src.util.settings import Settings

if TYPE_CHECKING:
    import redis.asyncio as aioredis

logger = get_logger(__name__)


@runtime_checkable
class AnomalyDetector(Protocol):
    """Detects whether a location update represents anomalous mobility behaviour."""

    async def is_anomaly(self, message: LocationMessage) -> bool:
        """Return True if the location update is anomalous, False otherwise."""
        ...


class DpgmmAnomalyDetector:
    """Per-user DPGMM + Kalman-sanity + CUSUM-drift inference.

    Implements ``AnomalyDetector``. Safe to run inside the Kafka consume loop:
    all exceptions are swallowed and logged; failure of any step returns False
    (not an anomaly) so the monitor loop stays alive.
    """

    def __init__(
        self,
        redis: "aioredis.Redis",
        storage: StorageService,
        ping_writer: PingWriter,
        settings: Settings,
    ) -> None:
        self._redis = redis
        self._ping_writer = ping_writer
        self._settings = settings
        self._loader = ModelLoader(redis=redis, storage=storage, settings=settings)
        self._kf_threshold = kalman.mahalanobis_threshold(settings.mobility_kf_fpr)

    async def is_anomaly(self, message: LocationMessage) -> bool:
        try:
            return await self._evaluate(message)
        except Exception as exc:
            logger.error(
                "Anomaly evaluation failed",
                extra={"userId": str(message.userId), "error": str(exc)},
            )
            return False

    async def _evaluate(self, message: LocationMessage) -> bool:
        uid = message.userId

        # 1) projection — required before anything else.
        projection = await self._loader.load_projection(uid)
        if projection is None:
            return False

        # 2) KF state + predict forward to this message timestamp.
        z_xy = np.asarray(projection.project(message.latitudeDeg, message.longitudeDeg), dtype=float)
        existing = await redis_cache.get_kf(self._redis, uid)
        if existing is None:
            kf_state = kalman.seed_state(z_xy, message.timestampMs)
            sanity_passed = True
        else:
            predicted = kalman.predict(
                existing,
                message.timestampMs,
                q_pos=self._settings.mobility_kf_process_pos_sigma,
                q_vel=self._settings.mobility_kf_process_vel_sigma,
            )
            sigma = max(message.accuracyMeter, self._settings.mobility_kf_gps_sigma_m)
            R = np.eye(2) * (sigma ** 2)
            dist = kalman.mahalanobis(predicted, z_xy, R)
            if dist > self._kf_threshold:
                # Glitch: keep prediction only, skip persistence and scoring.
                kf_state = predicted
                sanity_passed = False
            else:
                kf_state = kalman.update(predicted, z_xy, R)
                sanity_passed = True

        await redis_cache.set_kf(self._redis, uid, kf_state)

        if not sanity_passed:
            return False

        # 3) Persist ping (fire-and-forget) for future training.
        ts = datetime.fromtimestamp(message.timestampMs / 1000.0, tz=timezone.utc)
        hour = ts.hour
        dow = ts.weekday()
        self._ping_writer.submit(
            {
                "user_id": uid,
                "latitude_deg": float(message.latitudeDeg),
                "longitude_deg": float(message.longitudeDeg),
                "accuracy_meter": float(message.accuracyMeter),
                "velocity_mps": float(message.velocityMps),
                "event_ts": ts,
                "hour_of_day": hour,
                "day_of_week": dow,
            }
        )

        # 4) Suspended bucket → no flag.
        if await redis_cache.is_suspended(self._redis, uid, hour, dow):
            return False

        # 5) Load components + threshold.
        loaded = await self._loader.load_bucket(uid, hour, dow)
        if loaded is None:
            return False
        components, threshold = loaded

        # 6) Score.
        xy_scaled = scale(components, z_xy)
        ll = log_likelihood(components, xy_scaled)
        is_anom = ll < threshold

        # 7) CUSUM update + drift handling.
        cusum_state = await redis_cache.get_cusum(self._redis, uid, hour, dow)
        new_state, drift = cusum_mod.update(
            cusum_state,
            is_anom,
            k=self._settings.mobility_cusum_k,
            h=self._settings.mobility_cusum_h,
            min_n=self._settings.mobility_cusum_min_n,
        )
        if drift:
            await redis_cache.set_suspended(self._redis, uid, hour, dow)
            await redis_cache.mark_drift(self._redis, uid, hour, dow)
            logger.info(
                "Mobility bucket suspended by CUSUM drift",
                extra={"userId": str(uid), "hour": hour, "dow": dow, "s": new_state.s},
            )

        await redis_cache.set_cusum(self._redis, uid, hour, dow, new_state)

        return is_anom
