import uuid

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Boolean, Float, DateTime, UUID

Base = declarative_base()

class Location(Base):
    __tablename__ = "location"

    id = Column(UUID, primary_key=True, default=uuid.uuid4())
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    accuracy = Column(Float, nullable=False, default=0.0)
    anomaly = Column(Boolean, nullable=False, default=False)