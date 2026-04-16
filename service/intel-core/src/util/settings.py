from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path

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
    s3_bucket_name: str = "criminal-reports"
    s3_region: str = "us-east-1"
    s3_presign_expiration: int = 3600

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    redis_url: str = ""
    session_retention_days: int = 3
    cleanup_interval_hours: int = 24

    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_group_id: str = "intel-core"
    kafka_location_topic: str = "location-updated"
    kafka_notification_topic: str = "tracking-notification"
    kafka_ca_cert_path: str = ""
    kafka_sasl_mechanism: str = ""
    kafka_sasl_username: str = ""
    kafka_sasl_password: str = ""

    model_config = {
        "env_file": BASE_DIR / ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

@lru_cache
def get_settings() -> Settings:
    return Settings()
