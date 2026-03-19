from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Application Settings"""

    database_url: str
    redis_url: str
    kafka_bootstrap_servers: str
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
