# Env-backed settings — DATABASE_URL and JWT config consumed by DB session and auth routes.
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

FORBIDDEN_JWT_SECRETS = frozenset({"", "change-me-in-production"})

JWT_SECRET_HELP = (
    'JWT_SECRET is unset or insecure (refuses empty and "change-me-in-production"). '
    'Generate one with: python -c "import secrets; print(secrets.token_urlsafe(48))" '
    "or: python scripts/generate_jwt_secret.py — then set JWT_SECRET in backend/.env "
    "(Render already auto-generates JWT_SECRET)."
)


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://wayfinder:wayfinder@localhost:55432/wayfinder"
    # Default is intentionally insecure so misconfigured deploys fail the validator.
    jwt_secret: str = "change-me-in-production"
    jwt_expire_hours: int = 24
    cors_origins: str = (
        "http://localhost:8081,http://localhost:8085,http://localhost:8086,"
        "http://localhost:8087,http://localhost:19006,"
        "http://127.0.0.1:8081,http://127.0.0.1:8085,http://127.0.0.1:8086,"
        "http://127.0.0.1:8087,http://127.0.0.1:19006"
    )
    google_maps_api_key: str = ""
    places_provider: str = "mock"
    google_places_base_url: str = "https://places.googleapis.com/v1"
    hotel_api_key: str = ""
    weather_api_key: str = ""
    weather_provider: str = "mock"
    weatherapi_base_url: str = "https://api.weatherapi.com/v1"
    travel_advisory_api_key: str = ""
    travel_risk_provider: str = "mock"
    travel_risk_api_key: str = ""
    travel_risk_base_url: str = "https://travelriskapi.com/api/v1"
    travel_risk_cache_ttl_seconds: int = 300
    openai_api_key: str = ""
    liteapi_api_key: str = ""
    liteapi_base_url: str = "https://api.liteapi.travel/v3.0"
    liteapi_guest_nationality: str = "US"
    liteapi_currency: str = "USD"
    hotel_provider: str = "mock"
    use_mock_providers: bool = True
    external_request_timeout_seconds: int = 30

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("jwt_secret")
    @classmethod
    def jwt_secret_must_be_secure(cls, value: str) -> str:
        secret = (value or "").strip()
        if secret in FORBIDDEN_JWT_SECRETS:
            raise ValueError(JWT_SECRET_HELP)
        return secret

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

    def is_local_database(self) -> bool:
        """True for Docker/local Postgres — never for Supabase/production hosts."""
        url = self.database_url.lower()
        if "supabase.co" in url or "pooler.supabase.com" in url or "render.com" in url:
            return False
        return any(
            host in url
            for host in (
                "localhost",
                "127.0.0.1",
                "@db:",
                "@wayfinder-db",
            )
        )


settings = Settings()
