from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
import orjson
from scipy.stats import chi2


def mahalanobis_threshold(false_positive_rate: float) -> float:
    """sqrt of chi2 inverse with 2 dof — matches spec (fpr=0.01 → ~3.03)."""
    return float(math.sqrt(chi2.ppf(1.0 - false_positive_rate, df=2)))


@dataclass
class KFState:
    """Constant-velocity Kalman state in projected metric coords.

    x = [px, py, vx, vy]; P is 4x4 covariance; last_ts_ms is the timestamp of the
    most recent update (used to compute dt for the next predict).
    """

    x: np.ndarray
    P: np.ndarray
    last_ts_ms: int

    def to_json(self) -> bytes:
        return orjson.dumps(
            {
                "x": self.x.tolist(),
                "P": self.P.tolist(),
                "last_ts_ms": int(self.last_ts_ms),
            }
        )

    @classmethod
    def from_json(cls, blob: bytes) -> "KFState":
        data = orjson.loads(blob)
        return cls(
            x=np.asarray(data["x"], dtype=float),
            P=np.asarray(data["P"], dtype=float),
            last_ts_ms=int(data["last_ts_ms"]),
        )


def seed_state(z_xy: np.ndarray, now_ms: int, init_pos_var: float = 1e4) -> KFState:
    """Initialise a fresh state anchored at the first measurement."""
    x = np.array([z_xy[0], z_xy[1], 0.0, 0.0], dtype=float)
    P = np.diag([init_pos_var, init_pos_var, 25.0, 25.0])
    return KFState(x=x, P=P, last_ts_ms=now_ms)


def _F(dt: float) -> np.ndarray:
    return np.array(
        [
            [1.0, 0.0, dt, 0.0],
            [0.0, 1.0, 0.0, dt],
            [0.0, 0.0, 1.0, 0.0],
            [0.0, 0.0, 0.0, 1.0],
        ]
    )


def _Q(dt: float, q_pos: float, q_vel: float) -> np.ndarray:
    return np.diag([q_pos * dt, q_pos * dt, q_vel * dt, q_vel * dt])


_H = np.array([[1.0, 0.0, 0.0, 0.0], [0.0, 1.0, 0.0, 0.0]])


def predict(
    state: KFState,
    now_ms: int,
    q_pos: float,
    q_vel: float,
) -> KFState:
    dt = max((now_ms - state.last_ts_ms) / 1000.0, 0.0)
    F = _F(dt)
    Q = _Q(dt, q_pos, q_vel)
    x_pred = F @ state.x
    P_pred = F @ state.P @ F.T + Q
    return KFState(x=x_pred, P=P_pred, last_ts_ms=now_ms)


def mahalanobis(predicted: KFState, z_xy: np.ndarray, R: np.ndarray) -> float:
    S = _H @ predicted.P @ _H.T + R
    y = z_xy - _H @ predicted.x
    try:
        d2 = float(y.T @ np.linalg.solve(S, y))
    except np.linalg.LinAlgError:
        return float("inf")
    return math.sqrt(max(d2, 0.0))


def update(predicted: KFState, z_xy: np.ndarray, R: np.ndarray) -> KFState:
    S = _H @ predicted.P @ _H.T + R
    K = predicted.P @ _H.T @ np.linalg.inv(S)
    y = z_xy - _H @ predicted.x
    x_new = predicted.x + K @ y
    P_new = (np.eye(4) - K @ _H) @ predicted.P
    return KFState(x=x_new, P=P_new, last_ts_ms=predicted.last_ts_ms)
