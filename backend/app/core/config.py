# Env-backed settings — DATABASE_URL and JWT config consumed by DB session and auth routes.
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://wayfinder:wayfinder@localhost:55432/wayfinder"
    jwt_secret: str = "change-me-in-production"
    jwt_expire_hours: int = 24
    cors_origins: str = (
        "http://localhost:8081,http://localhost:8085,http://localhost:8086,"
        "http://localhost:8087,http://localhost:19006,"
        "http://127.0.0.1:8081,http://127.0.0.1:8085,http://127.0.0.1:8086,"
        "http://127.0.0.1:8087,http://127.0.0.1:19006"
    )
    google_maps_api_key: str = ""
    hotel_api_key: str = ""
    weather_api_key: str = ""
    weather_provider: str = "mock"
    weatherapi_base_url: str = "https://api.weatherapi.com/v1"
    travel_advisory_api_key: str = ""
    openai_api_key: str = ""
    liteapi_api_key: str = ""
    liteapi_base_url: str = "https://api.liteapi.travel/v3.0"
    liteapi_guest_nationality: str = "US"
    liteapi_currency: str = "USD"
    hotel_provider: str = "mock"
    use_mock_providers: bool = True
    external_request_timeout_seconds: int = 30

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def async_database_url(self) -> str:
        """Normalize Supabase/Render Postgres URLs for SQLAlchemy asyncpg."""
        url = self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

        uses_supabase = "supabase.co" in url or "pooler.supabase.com" in url
        if uses_supabase and "ssl=" not in url:
            separator = "&" if "?" in url else "?"
            url = f"{url}{separator}ssl=require"

        return url

    def database_connect_args(self) -> dict[str, int]:
        """asyncpg options for Supabase pooler compatibility."""
        if "supabase.co" in self.database_url or "pooler.supabase.com" in self.database_url:
            # PgBouncer (transaction pooler) rejects prepared statement caching.
            return {"statement_cache_size": 0}
        return {}


settings = Settings()
