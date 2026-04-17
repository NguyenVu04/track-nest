from __future__ import annotations

import numpy as np

from src.ai.inference import kalman


def filter_glitches(
    xy: np.ndarray,
    ts_ms: np.ndarray,
    accuracy_m: np.ndarray,
    fpr: float,
    gps_sigma_m: float,
    q_pos: float,
    q_vel: float,
) -> np.ndarray:
    """Return a boolean mask of pings that pass the offline Kalman sanity filter.

    Runs the same constant-velocity KF used online over the training series. The
    first point always passes (seeds the filter). On reject the filter advances
    using the prediction only.
    """
    n = xy.shape[0]
    if n == 0:
        return np.zeros(0, dtype=bool)

    threshold = kalman.mahalanobis_threshold(fpr)
    mask = np.zeros(n, dtype=bool)

    state = kalman.seed_state(xy[0], int(ts_ms[0]))
    mask[0] = True

    for i in range(1, n):
        predicted = kalman.predict(state, int(ts_ms[i]), q_pos=q_pos, q_vel=q_vel)
        sigma = max(float(accuracy_m[i]), gps_sigma_m)
        R = np.eye(2) * (sigma ** 2)
        d = kalman.mahalanobis(predicted, xy[i], R)
        if d > threshold:
            state = predicted
            mask[i] = False
        else:
            state = kalman.update(predicted, xy[i], R)
            mask[i] = True

    return mask
