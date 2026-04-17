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
    s3_region: str = "us-east-1"
    s3_presign_expiration: int = 3600

    s3_criminalreports_access_key: str = ""
    s3_criminalreports_secret_key: str = ""
    s3_criminalreports_bucket_name: str = "criminal-reports"

    s3_usertracking_access_key: str = ""
    s3_usertracking_secret_key: str = ""
    s3_usertracking_bucket_name: str = "user-tracking"

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

    # Mobility anomaly detection
    mobility_min_pings: int = 50
    mobility_training_window_days: int = 28
    mobility_anomaly_quantile: float = 0.05
    mobility_kf_fpr: float = 0.01
    mobility_kf_gps_sigma_m: float = 15.0
    mobility_kf_process_pos_sigma: float = 1.0
    mobility_kf_process_vel_sigma: float = 0.5
    mobility_cusum_k: float = 0.10
    mobility_cusum_h: float = 5.0
    mobility_cusum_min_n: int = 30
    mobility_subsample_radius_m: float = 50.0
    mobility_full_refit_interval_days: int = 7
    mobility_warm_refit_interval_days: int = 1
    mobility_drift_refit_cooldown_hours: int = 6
    mobility_ping_retention_days: int = 90
    mobility_model_s3_prefix: str = "mobility_models/"
    mobility_ping_flush_interval_s: float = 1.0
    mobility_ping_batch_size: int = 200
    mobility_max_components: int = 20

    model_config = {
        "env_file": BASE_DIR / ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

@lru_cache
def get_settings() -> Settings:
    return Settings()
