from enum import Enum

from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship

from core.entity.base import Base

class PoiType(Base):
    __tablename__ = "poi_type"

    name = Column(String(15), primary_key=True)

    # One-to-many relationship
    translations = relationship(
        "PoiTypeTranslation",
        back_populates="poi_type",
        cascade="all, delete-orphan"
    )


class PoiTypeTranslation(Base):
    __tablename__ = "poi_type_translation"

    type_name = Column(
        String(15),
        ForeignKey("poi_type.name", ondelete="CASCADE"),
        primary_key=True
    )

    language_code = Column(String(2), primary_key=True)
    value = Column(String(100), nullable=False)

class PoiTypeEnum(Enum):
    HOME = "HOME"
    WORK = "WORK"
    SCHOOL = "SCHOOL"
    AMUSEMENT = "AMUSEMENT"
    RESTAURANT = "RESTAURANT"
    SHOP = "SHOP"
    SPORT = "SPORT"