# Env-backed settings — DATABASE_URL and JWT config consumed by DB session and auth routes.
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://wayfinder:wayfinder@localhost:55432/wayfinder"
    jwt_secret: str = "change-me-in-production"
    jwt_expire_hours: int = 24
    cors_origins: str = (
        "http://localhost:8081,http://localhost:19006,"
        "http://127.0.0.1:8081,http://127.0.0.1:19006"
    )

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
