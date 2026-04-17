from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Float, Integer
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.configuration.database.setup import Base


class UserProfile(Base):
    __tablename__ = "user_profile"

    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    centroid_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    centroid_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_full_refit_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_warm_refit_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    total_training_samples: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
