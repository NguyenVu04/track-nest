from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Float, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.configuration.database.setup import Base


class UserSpeedProfile(Base):
    __tablename__ = "user_speed_profile"

    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    p50_mps: Mapped[float] = mapped_column(Float, nullable=False)
    p95_mps: Mapped[float] = mapped_column(Float, nullable=False)
    p99_mps: Mapped[float] = mapped_column(Float, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
