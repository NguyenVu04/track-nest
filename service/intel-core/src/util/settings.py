from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path
import os

BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    app_name: str = "intel-core"

    database_url: str = ""

    log_level: str = "INFO"
    auth_required: bool = True
    auth_exempt_paths: str = "/docs,/redoc,/openapi.json,/health,/healthz"

    s3_endpoint: str = ""
    s3_access_key: str = ""
    s3_secret_key: str = ""
    s3_bucket_name: str = ""
    s3_region: str = "us-east-1"
    s3_presign_expiration: int = 3600

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    class Config:
        env_file: Path = BASE_DIR / ".env"
        env_file_encoding: str = "utf-8"
        extra: str = "ignore"

@lru_cache
def get_settings() -> Settings:
    settings: Settings = Settings()
    return settings
