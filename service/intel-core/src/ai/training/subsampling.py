from __future__ import annotations

import numpy as np


def spatial_subsample(xy: np.ndarray, radius_m: float) -> np.ndarray:
    """Grid-snap subsample: keep at most one ping per (radius_m x radius_m) cell.

    Much cheaper than farthest-first and good enough for de-duplicating dense
    stay-points at 3-minute cadence.
    """
    if xy.shape[0] == 0:
        return xy
    grid = np.floor(xy / radius_m).astype(np.int64)
    # stable unique by row
    _, idx = np.unique(grid, axis=0, return_index=True)
    idx_sorted = np.sort(idx)
    return xy[idx_sorted]
