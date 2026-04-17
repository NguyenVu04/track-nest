from __future__ import annotations

import numpy as np

from src.ai.inference.gmm_scorer import GmmComponents, log_likelihood


def calibrate(components: GmmComponents, xy_scaled_training: np.ndarray, quantile: float) -> float:
    """Return the log-likelihood quantile below which a ping is treated as anomalous."""
    lls = np.fromiter(
        (log_likelihood(components, xy_scaled_training[i]) for i in range(xy_scaled_training.shape[0])),
        dtype=float,
        count=xy_scaled_training.shape[0],
    )
    return float(np.quantile(lls, quantile))
