from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

import numpy as np
from sqlalchemy import text

from src.ai.inference.gmm_scorer import GmmComponents
from src.ai.inference.projection import UserProjection
from src.ai.inference.redis_cache import (
    components_key,
    cusum_key,
    proj_key,
    suspended_key,
    threshold_key,
)
from src.ai.training.artifact_writer import ArtifactWriter
from src.ai.training.dpgmm_fitter import fit_bucket
from src.ai.training.sanity_filter import filter_glitches
from src.ai.training.subsampling import spatial_subsample
from src.ai.training.threshold_calibrator import calibrate
from src.configuration.database.setup import SessionLocal
from src.configuration.redis.setup import get_sync_redis_client
from src.configuration.storage.setup import get_user_tracking_client
from src.configuration.storage.storage_service import StorageService
from src.util.logging import get_logger
from src.util.settings import Settings, get_settings

logger = get_logger(__name__)


class UserRetrainer:
    """Orchestrates a single user's training run (full / warm / drift)."""

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()
        self._storage = StorageService(
            bucket=self._settings.s3_usertracking_bucket_name,
            client=get_user_tracking_client(),
        )
        self._writer = ArtifactWriter(self._storage, self._settings)
        self._redis = get_sync_redis_client()

    def retrain_user(self, user_id: UUID, kind: str) -> dict[str, Any]:
        log_id = self._insert_log(user_id, kind)
        try:
            result = self._run(user_id, kind)
            self._finalize_log(log_id, status="ok", buckets=result["buckets_trained"], samples=result["samples_used"])
            return result
        except Exception as exc:
            logger.exception("User retrain failed", extra={"user_id": str(user_id), "kind": kind})
            self._finalize_log(log_id, status="failed", buckets=0, samples=0, error=str(exc)[:1000])
            raise

    # ------------------------------------------------------------------ internals

    def _run(self, user_id: UUID, kind: str) -> dict[str, Any]:
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(days=self._settings.mobility_training_window_days)

        rows = self._load_pings(user_id, window_start)
        if len(rows) < self._settings.mobility_min_pings:
            logger.info(
                "Skipping retrain — not enough pings",
                extra={"user_id": str(user_id), "count": len(rows), "min": self._settings.mobility_min_pings},
            )
            return {"buckets_trained": 0, "samples_used": len(rows), "skipped": True}

        lat = np.fromiter((r["latitude_deg"] for r in rows), dtype=float, count=len(rows))
        lng = np.fromiter((r["longitude_deg"] for r in rows), dtype=float, count=len(rows))
        ts_ms = np.fromiter(
            (int(r["event_ts"].timestamp() * 1000) for r in rows), dtype=np.int64, count=len(rows)
        )
        acc = np.fromiter((r["accuracy_meter"] for r in rows), dtype=float, count=len(rows))
        vel = np.fromiter((r["velocity_mps"] for r in rows), dtype=float, count=len(rows))
        hours = np.fromiter((r["hour_of_day"] for r in rows), dtype=np.int16, count=len(rows))
        dows = np.fromiter((r["day_of_week"] for r in rows), dtype=np.int16, count=len(rows))

        # Centroid + projection.
        centroid_lat = float(lat.mean())
        centroid_lng = float(lng.mean())
        projection = UserProjection(centroid_lat, centroid_lng)
        xy = np.empty((len(rows), 2), dtype=float)
        for i in range(len(rows)):
            xy[i] = projection.project(lat[i], lng[i])

        # Kalman sanity filter.
        mask = filter_glitches(
            xy=xy,
            ts_ms=ts_ms,
            accuracy_m=acc,
            fpr=self._settings.mobility_kf_fpr,
            gps_sigma_m=self._settings.mobility_kf_gps_sigma_m,
            q_pos=self._settings.mobility_kf_process_pos_sigma,
            q_vel=self._settings.mobility_kf_process_vel_sigma,
        )
        xy = xy[mask]
        hours = hours[mask]
        dows = dows[mask]
        vel = vel[mask]

        if len(xy) < self._settings.mobility_min_pings:
            return {"buckets_trained": 0, "samples_used": int(mask.sum()), "skipped": True}

        # Upload projection artifact + upsert UserProfile.
        self._writer.write_projection(user_id, projection)
        self._upsert_user_profile(user_id, centroid_lat, centroid_lng, kind, now, int(mask.sum()))
        self._redis.delete(proj_key(user_id))

        # Speed profile.
        self._upsert_speed_profile(user_id, vel)

        # Per-bucket fit.
        warm_start = kind == "warm"
        buckets_trained = 0
        total_samples = 0
        for h in range(24):
            for dow in range(7):
                sel = (hours == h) & (dows == dow)
                bucket_xy = xy[sel]
                bucket_xy = spatial_subsample(bucket_xy, self._settings.mobility_subsample_radius_m)
                if bucket_xy.shape[0] < self._settings.mobility_min_pings:
                    continue

                fit = fit_bucket(
                    bucket_xy,
                    max_components=self._settings.mobility_max_components,
                    warm_start=warm_start,
                )

                comps = GmmComponents.from_arrays(
                    weights=fit.weights,
                    means=fit.means,
                    covariances=fit.covariances,
                    scaler_mean=fit.scaler_mean,
                    scaler_std=fit.scaler_std,
                )
                threshold = calibrate(
                    comps,
                    fit.xy_scaled,
                    quantile=self._settings.mobility_anomaly_quantile,
                )

                s3_key = self._writer.write_bucket(
                    user_id=user_id,
                    hour=h,
                    dow=dow,
                    weights=fit.weights,
                    means=fit.means,
                    covariances=fit.covariances,
                    scaler_mean=fit.scaler_mean,
                    scaler_std=fit.scaler_std,
                    threshold=threshold,
                )

                self._upsert_bucket_model(
                    user_id=user_id,
                    hour=h,
                    dow=dow,
                    n_components=int(fit.weights.shape[0]),
                    n_samples=int(bucket_xy.shape[0]),
                    threshold=threshold,
                    s3_key=s3_key,
                )

                # Invalidate Redis cache for this bucket and reset CUSUM / suspended flag.
                self._redis.delete(components_key(user_id, h, dow))
                self._redis.delete(threshold_key(user_id, h, dow))
                self._redis.delete(cusum_key(user_id, h, dow))
                self._redis.delete(suspended_key(user_id, h, dow))

                buckets_trained += 1
                total_samples += int(bucket_xy.shape[0])

        return {"buckets_trained": buckets_trained, "samples_used": total_samples, "skipped": False}

    def _load_pings(self, user_id: UUID, window_start: datetime) -> list[dict[str, Any]]:
        db = SessionLocal()
        try:
            rows = db.execute(
                text(
                    """
                    SELECT latitude_deg, longitude_deg, accuracy_meter, velocity_mps,
                           event_ts, hour_of_day, day_of_week
                    FROM location_ping
                    WHERE user_id = :uid AND event_ts >= :since
                    ORDER BY event_ts
                    """
                ),
                {"uid": user_id, "since": window_start},
            ).mappings().all()
            return [dict(r) for r in rows]
        finally:
            db.close()

    def _insert_log(self, user_id: UUID, kind: str) -> UUID:
        db = SessionLocal()
        try:
            row = db.execute(
                text(
                    """
                    INSERT INTO retraining_log (user_id, kind, status)
                    VALUES (:uid, :kind, 'running')
                    RETURNING id
                    """
                ),
                {"uid": user_id, "kind": kind},
            ).fetchone()
            db.commit()
            return UUID(str(row[0]))
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def _finalize_log(
        self,
        log_id: UUID,
        status: str,
        buckets: int,
        samples: int,
        error: str | None = None,
    ) -> None:
        db = SessionLocal()
        try:
            db.execute(
                text(
                    """
                    UPDATE retraining_log
                    SET status = :status,
                        finished_at = now(),
                        buckets_trained = :buckets,
                        samples_used = :samples,
                        error = :error
                    WHERE id = :id
                    """
                ),
                {
                    "status": status,
                    "buckets": buckets,
                    "samples": samples,
                    "error": error,
                    "id": log_id,
                },
            )
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()

    def _upsert_user_profile(
        self,
        user_id: UUID,
        centroid_lat: float,
        centroid_lng: float,
        kind: str,
        now: datetime,
        samples: int,
    ) -> None:
        last_full = now if kind == "full" else None
        last_warm = now if kind in ("warm", "drift") else None
        db = SessionLocal()
        try:
            db.execute(
                text(
                    """
                    INSERT INTO user_profile
                        (user_id, centroid_lat, centroid_lng,
                         last_full_refit_at, last_warm_refit_at, last_seen_at,
                         total_training_samples)
                    VALUES
                        (:uid, :lat, :lng, :full, :warm, :now, :samples)
                    ON CONFLICT (user_id) DO UPDATE SET
                        centroid_lat = EXCLUDED.centroid_lat,
                        centroid_lng = EXCLUDED.centroid_lng,
                        last_full_refit_at = COALESCE(EXCLUDED.last_full_refit_at, user_profile.last_full_refit_at),
                        last_warm_refit_at = COALESCE(EXCLUDED.last_warm_refit_at, user_profile.last_warm_refit_at),
                        last_seen_at = EXCLUDED.last_seen_at,
                        total_training_samples = EXCLUDED.total_training_samples
                    """
                ),
                {
                    "uid": user_id,
                    "lat": centroid_lat,
                    "lng": centroid_lng,
                    "full": last_full,
                    "warm": last_warm,
                    "now": now,
                    "samples": samples,
                },
            )
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def _upsert_speed_profile(self, user_id: UUID, vel: np.ndarray) -> None:
        if vel.size == 0:
            return
        p50 = float(np.quantile(vel, 0.50))
        p95 = float(np.quantile(vel, 0.95))
        p99 = float(np.quantile(vel, 0.99))
        db = SessionLocal()
        try:
            db.execute(
                text(
                    """
                    INSERT INTO user_speed_profile (user_id, p50_mps, p95_mps, p99_mps, updated_at)
                    VALUES (:uid, :p50, :p95, :p99, now())
                    ON CONFLICT (user_id) DO UPDATE SET
                        p50_mps = EXCLUDED.p50_mps,
                        p95_mps = EXCLUDED.p95_mps,
                        p99_mps = EXCLUDED.p99_mps,
                        updated_at = now()
                    """
                ),
                {"uid": user_id, "p50": p50, "p95": p95, "p99": p99},
            )
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def _upsert_bucket_model(
        self,
        user_id: UUID,
        hour: int,
        dow: int,
        n_components: int,
        n_samples: int,
        threshold: float,
        s3_key: str,
    ) -> None:
        db = SessionLocal()
        try:
            db.execute(
                text(
                    """
                    INSERT INTO user_bucket_model
                        (user_id, hour_of_day, day_of_week, n_components, n_samples,
                         threshold_loglik, s3_key, suspended, trained_at)
                    VALUES
                        (:uid, :h, :dow, :nc, :ns, :thr, :key, FALSE, now())
                    ON CONFLICT (user_id, hour_of_day, day_of_week) DO UPDATE SET
                        n_components = EXCLUDED.n_components,
                        n_samples = EXCLUDED.n_samples,
                        threshold_loglik = EXCLUDED.threshold_loglik,
                        s3_key = EXCLUDED.s3_key,
                        suspended = FALSE,
                        trained_at = now()
                    """
                ),
                {
                    "uid": user_id,
                    "h": hour,
                    "dow": dow,
                    "nc": n_components,
                    "ns": n_samples,
                    "thr": threshold,
                    "key": s3_key,
                },
            )
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()
