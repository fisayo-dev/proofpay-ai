# backend/app/core/config.py

from pydantic_settings import BaseSettings, SettingsConfigDict

DB_QUERY_TIMEOUT_SECONDS = 10


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    kora_public_key: str = ""
    kora_secret_key: str = ""
    kora_webhook_url: str = ""
    frontend_base_url: str = "http://localhost:3000"
    backend_base_url: str = "http://localhost:8000"
    session_secret: str = ""
    env: str = "development"

settings = Settings()
