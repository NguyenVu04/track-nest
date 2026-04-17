from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass
class FitResult:
    weights: np.ndarray          # (K,)
    means: np.ndarray            # (K, 2) in scaled space
    covariances: np.ndarray      # (K, 2, 2) in scaled space
    scaler_mean: np.ndarray      # (2,)
    scaler_std: np.ndarray       # (2,)
    xy_scaled: np.ndarray        # (N, 2) scaled training matrix (for threshold calibration)


def fit_bucket(
    xy: np.ndarray,
    max_components: int = 20,
    weight_floor: float = 1e-3,
    warm_start: bool = False,
) -> FitResult:
    """Fit a DPGMM to this bucket's projected pings and return plain NumPy params.

    sklearn is imported lazily so callers that only need inference don't pay the
    import cost.
    """
    from sklearn.mixture import BayesianGaussianMixture

    scaler_mean = xy.mean(axis=0)
    scaler_std = xy.std(axis=0)
    scaler_std = np.where(scaler_std < 1e-6, 1.0, scaler_std)
    xy_scaled = (xy - scaler_mean) / scaler_std

    max_iter = 50 if warm_start else 200
    bgm = BayesianGaussianMixture(
        n_components=max_components,
        covariance_type="full",
        weight_concentration_prior_type="dirichlet_process",
        max_iter=max_iter,
        random_state=0,
    )
    bgm.fit(xy_scaled)

    weights: np.ndarray = np.asarray(bgm.weights_)
    means: np.ndarray = np.asarray(bgm.means_)
    covariances: np.ndarray = np.asarray(bgm.covariances_)
    keep: np.ndarray = weights >= weight_floor
    if not keep.any():
        keep = np.zeros_like(keep, dtype=bool)
        keep[int(np.argmax(weights))] = True

    w: np.ndarray = weights[keep]
    w = w / w.sum()
    return FitResult(
        weights=w.astype(float),
        means=means[keep].astype(float),
        covariances=covariances[keep].astype(float),
        scaler_mean=scaler_mean.astype(float),
        scaler_std=scaler_std.astype(float),
        xy_scaled=xy_scaled,
    )
