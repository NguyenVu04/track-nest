from __future__ import annotations

from dataclasses import dataclass

import orjson


@dataclass
class CusumState:
    s: float = 0.0
    n: int = 0
    last_flag_ts_ms: int = 0

    def to_json(self) -> bytes:
        return orjson.dumps({"s": self.s, "n": self.n, "last_flag_ts_ms": self.last_flag_ts_ms})

    @classmethod
    def from_json(cls, blob: bytes) -> "CusumState":
        data = orjson.loads(blob)
        return cls(
            s=float(data.get("s", 0.0)),
            n=int(data.get("n", 0)),
            last_flag_ts_ms=int(data.get("last_flag_ts_ms", 0)),
        )


def update(
    state: CusumState,
    is_anomaly: bool,
    k: float,
    h: float,
    min_n: int,
) -> tuple[CusumState, bool]:
    """Return (new_state, drift_triggered). Drift requires s >= h AND n >= min_n."""
    indicator = 1.0 if is_anomaly else 0.0
    new_s = max(0.0, state.s + indicator - k)
    new_n = state.n + 1
    new_state = CusumState(s=new_s, n=new_n, last_flag_ts_ms=state.last_flag_ts_ms)
    drift = new_s >= h and new_n >= min_n
    return new_state, drift


def reset() -> CusumState:
    return CusumState()
