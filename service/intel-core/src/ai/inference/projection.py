from __future__ import annotations

import math
from dataclasses import dataclass

import orjson

EARTH_RADIUS_M = 6_371_000.0


@dataclass(frozen=True)
class UserProjection:
    lat0_deg: float
    lng0_deg: float

    def project(self, lat_deg: float, lng_deg: float) -> tuple[float, float]:
        cos_lat0 = math.cos(math.radians(self.lat0_deg))
        x = EARTH_RADIUS_M * math.radians(lng_deg - self.lng0_deg) * cos_lat0
        y = EARTH_RADIUS_M * math.radians(lat_deg - self.lat0_deg)
        return x, y

    def to_json(self) -> bytes:
        return orjson.dumps({"lat0": self.lat0_deg, "lng0": self.lng0_deg})

    @classmethod
    def from_json(cls, blob: bytes) -> "UserProjection":
        data = orjson.loads(blob)
        return cls(lat0_deg=float(data["lat0"]), lng0_deg=float(data["lng0"]))
