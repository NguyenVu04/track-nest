from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path
import os

BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent

ENV: str = os.getenv("ENV", "dev")


class Settings(BaseSettings):
    app_name: str = "intel-core"
    env: str = ENV

    database_url: str = ""

    log_level: str = "INFO"
    auth_required: bool = True
    auth_exempt_paths: str = "/docs,/redoc,/openapi.json,/health,/healthz"

    class Config:
        env_file: Path = BASE_DIR / f".env.{ENV}"
        env_file_encoding: str = "utf-8"
        extra: str = "ignore"


@lru_cache
def get_settings() -> Settings:
    settings: Settings = Settings()
    return settings
