from __future__ import annotations

from typing import TYPE_CHECKING, Optional
from uuid import UUID

from src.ai.inference.cusum import CusumState
from src.ai.inference.gmm_scorer import GmmComponents
from src.ai.inference.kalman import KFState
from src.ai.inference.projection import UserProjection

if TYPE_CHECKING:
    import redis.asyncio as aioredis

KF_TTL_S = 48 * 3600
PROJ_TTL_S = 24 * 3600
COMPONENTS_TTL_S = 24 * 3600
THRESHOLD_TTL_S = 24 * 3600
CUSUM_TTL_S = 7 * 24 * 3600
SUSPENDED_TTL_S = 7 * 24 * 3600
DRIFT_FLAG_TTL_S = 7 * 24 * 3600


def kf_key(uid: UUID) -> str:
    return f"mob:{uid}:kf_state"


def proj_key(uid: UUID) -> str:
    return f"mob:{uid}:proj"


def components_key(uid: UUID, hour: int, dow: int) -> str:
    return f"mob:{uid}:{hour}:{dow}:components"


def threshold_key(uid: UUID, hour: int, dow: int) -> str:
    return f"mob:{uid}:{hour}:{dow}:threshold"


def cusum_key(uid: UUID, hour: int, dow: int) -> str:
    return f"mob:{uid}:{hour}:{dow}:cusum"


def suspended_key(uid: UUID, hour: int, dow: int) -> str:
    return f"mob:{uid}:{hour}:{dow}:suspended"


def drift_flag_key(uid: UUID) -> str:
    return f"mob:{uid}:drift_flag"


def drift_cooldown_key(uid: UUID) -> str:
    return f"mob:{uid}:drift_cooldown"


async def get_kf(r: "aioredis.Redis", uid: UUID) -> Optional[KFState]:
    raw = await r.get(kf_key(uid))
    return KFState.from_json(raw) if raw else None


async def set_kf(r: "aioredis.Redis", uid: UUID, state: KFState) -> None:
    await r.set(kf_key(uid), state.to_json(), ex=KF_TTL_S)


async def get_projection(r: "aioredis.Redis", uid: UUID) -> Optional[UserProjection]:
    raw = await r.get(proj_key(uid))
    return UserProjection.from_json(raw) if raw else None


async def set_projection(r: "aioredis.Redis", uid: UUID, proj: UserProjection) -> None:
    await r.set(proj_key(uid), proj.to_json(), ex=PROJ_TTL_S)


async def get_components(r: "aioredis.Redis", uid: UUID, h: int, dow: int) -> Optional[GmmComponents]:
    raw = await r.get(components_key(uid, h, dow))
    return GmmComponents.from_json(raw) if raw else None


async def set_components(r: "aioredis.Redis", uid: UUID, h: int, dow: int, comps: GmmComponents) -> None:
    await r.set(components_key(uid, h, dow), comps.to_json(), ex=COMPONENTS_TTL_S)


async def get_threshold(r: "aioredis.Redis", uid: UUID, h: int, dow: int) -> Optional[float]:
    raw = await r.get(threshold_key(uid, h, dow))
    return float(raw) if raw is not None else None


async def set_threshold(r: "aioredis.Redis", uid: UUID, h: int, dow: int, value: float) -> None:
    await r.set(threshold_key(uid, h, dow), str(value).encode("utf-8"), ex=THRESHOLD_TTL_S)


async def get_cusum(r: "aioredis.Redis", uid: UUID, h: int, dow: int) -> CusumState:
    raw = await r.get(cusum_key(uid, h, dow))
    return CusumState.from_json(raw) if raw else CusumState()


async def set_cusum(r: "aioredis.Redis", uid: UUID, h: int, dow: int, state: CusumState) -> None:
    await r.set(cusum_key(uid, h, dow), state.to_json(), ex=CUSUM_TTL_S)


async def is_suspended(r: "aioredis.Redis", uid: UUID, h: int, dow: int) -> bool:
    raw = await r.get(suspended_key(uid, h, dow))
    return raw is not None and raw not in (b"0", b"false", b"")


async def set_suspended(r: "aioredis.Redis", uid: UUID, h: int, dow: int) -> None:
    await r.set(suspended_key(uid, h, dow), b"1", ex=SUSPENDED_TTL_S)


async def clear_suspended(r: "aioredis.Redis", uid: UUID, h: int, dow: int) -> None:
    await r.delete(suspended_key(uid, h, dow))


async def mark_drift(r: "aioredis.Redis", uid: UUID, h: int, dow: int) -> None:
    await r.set(drift_flag_key(uid), f"{h}:{dow}".encode("utf-8"), ex=DRIFT_FLAG_TTL_S)
