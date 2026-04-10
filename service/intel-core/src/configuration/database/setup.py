from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from ...util import Settings, get_settings


class Base(DeclarativeBase):
    pass


settings: Settings = get_settings()

if not settings.database_url:
    raise RuntimeError("database_url must be configured for PostgreSQL integration.")

engine: Engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
)

SessionLocal: sessionmaker[Session] = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def dispose_database() -> None:
    engine.dispose()
