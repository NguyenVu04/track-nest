from datetime import datetime

from sqlalchemy import (
    Column,
    Float,
    Boolean,
    TIMESTAMP,
    func
)
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry
from sqlalchemy.orm import Mapped

from core.entity.base import Base

class Location(Base):
    __tablename__ = "location"

    longitude: Mapped[float] = Column(Float, nullable=False)
    latitude: Mapped[float] = Column(Float, nullable=False)

    timestamp: Mapped[datetime] = Column(
        TIMESTAMP(timezone=True),
        primary_key=True,
        nullable=False,
        server_default=func.now()
    )

    user_id: Mapped[UUID] = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False
    )

    anomaly: Mapped[bool] = Column(
        Boolean,
        nullable=False,
        server_default="false"
    )

    anomaly_score: Mapped[float] = Column(
        Float,
        nullable=False,
        server_default="0"
    )

    geom: Mapped = Column(
        Geometry(geometry_type="POINT", srid=4326),
        nullable=False
    )