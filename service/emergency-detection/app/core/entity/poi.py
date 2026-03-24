from datetime import datetime

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import (
    String,
    Float,
    DateTime,
    Computed,
    text,
    func
)

from geoalchemy2 import Geometry

from core.entity.base import Base

class Poi(Base):
    __tablename__ = "poi"

    # --- Primary Key ---
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )

    # --- Basic Info ---
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    type_name: Mapped[str] = mapped_column(
        String(15),
        nullable=False,
    )

    # --- Ownership ---
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
    )

    # --- Coordinates ---
    longitude: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    latitude: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    radius: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    # --- Timestamp ---
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # --- Geometry (computed from lat/lng) ---
    geom: Mapped = mapped_column(
        Geometry("POINT", srid=4326),
        Computed(
            "ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)"
        ),
        nullable=False,
    )