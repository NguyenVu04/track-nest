from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
import orjson

_LOG_2PI = math.log(2.0 * math.pi)


@dataclass(frozen=True)
class GmmComponents:
    """Pure-NumPy GMM parameters ready for O(K) per-ping scoring.

    weights:      (K,)
    means:        (K, 2)
    covariances:  (K, 2, 2)       — stored for serialization
    precisions:   (K, 2, 2)       — precomputed inverse covariances
    log_dets:     (K,)            — precomputed log|cov|
    scaler_mean:  (2,)
    scaler_std:   (2,)
    """

    weights: np.ndarray
    means: np.ndarray
    covariances: np.ndarray
    precisions: np.ndarray
    log_dets: np.ndarray
    scaler_mean: np.ndarray
    scaler_std: np.ndarray

    @classmethod
    def from_arrays(
        cls,
        weights: np.ndarray,
        means: np.ndarray,
        covariances: np.ndarray,
        scaler_mean: np.ndarray,
        scaler_std: np.ndarray,
    ) -> "GmmComponents":
        precisions = np.linalg.inv(covariances)
        sign, logabsdet = np.linalg.slogdet(covariances)
        log_dets = logabsdet
        return cls(
            weights=np.asarray(weights, dtype=float),
            means=np.asarray(means, dtype=float),
            covariances=np.asarray(covariances, dtype=float),
            precisions=precisions,
            log_dets=log_dets,
            scaler_mean=np.asarray(scaler_mean, dtype=float),
            scaler_std=np.asarray(scaler_std, dtype=float),
        )

    def to_json(self) -> bytes:
        return orjson.dumps(
            {
                "weights": self.weights.tolist(),
                "means": self.means.tolist(),
                "covariances": self.covariances.tolist(),
                "scaler_mean": self.scaler_mean.tolist(),
                "scaler_std": self.scaler_std.tolist(),
            }
        )

    @classmethod
    def from_json(cls, blob: bytes) -> "GmmComponents":
        data = orjson.loads(blob)
        return cls.from_arrays(
            weights=np.asarray(data["weights"], dtype=float),
            means=np.asarray(data["means"], dtype=float),
            covariances=np.asarray(data["covariances"], dtype=float),
            scaler_mean=np.asarray(data["scaler_mean"], dtype=float),
            scaler_std=np.asarray(data["scaler_std"], dtype=float),
        )


def scale(components: GmmComponents, xy: np.ndarray) -> np.ndarray:
    return (xy - components.scaler_mean) / components.scaler_std


def log_likelihood(components: GmmComponents, xy_scaled: np.ndarray) -> float:
    diffs = xy_scaled[None, :] - components.means            # (K, 2)
    quad = np.einsum("ki,kij,kj->k", diffs, components.precisions, diffs)
    log_comp = -0.5 * (2.0 * _LOG_2PI + components.log_dets + quad)
    log_w = np.log(np.maximum(components.weights, 1e-300))
    m = np.max(log_w + log_comp)
    return float(m + math.log(np.sum(np.exp(log_w + log_comp - m))))
