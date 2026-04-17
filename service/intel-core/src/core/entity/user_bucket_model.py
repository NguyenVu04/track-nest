from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Float, Index, Integer, SmallInteger, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.configuration.database.setup import Base


class UserBucketModel(Base):
    __tablename__ = "user_bucket_model"

    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    hour_of_day: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    day_of_week: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    n_components: Mapped[int] = mapped_column(Integer, nullable=False)
    n_samples: Mapped[int] = mapped_column(Integer, nullable=False)
    threshold_loglik: Mapped[float] = mapped_column(Float, nullable=False)
    s3_key: Mapped[str] = mapped_column(String(512), nullable=False)
    suspended: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    trained_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    __table_args__ = (Index("ix_user_bucket_model_user", "user_id"),)
