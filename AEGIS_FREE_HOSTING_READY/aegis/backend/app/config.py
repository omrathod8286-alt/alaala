from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AEGIS_", env_file=".env", extra="ignore")
    mode: str = "production"
    signing_secret: str = Field(default="", repr=False)
    database_url: str = "sqlite:///./aegis-demo.db"
    allowed_origins: list[str] = ["http://localhost:5173"]
    token_minutes: int = Field(default=15, ge=1, le=60)

    @model_validator(mode="after")
    def validate_mode(self):
        if self.mode not in {"demo", "production"}:
            raise ValueError("mode must be demo or production")
        if len(self.signing_secret) < 32 or self.signing_secret.startswith("REPLACE_"):
            raise ValueError("AEGIS_SIGNING_SECRET must be at least 32 characters")
        if self.mode == "production" and not self.database_url.startswith("postgresql+psycopg://"):
            raise ValueError("Production requires PostgreSQL; no SQLite fallback")
        if "*" in self.allowed_origins:
            raise ValueError("Wildcard CORS is prohibited")
        return self


@lru_cache
def settings():
    return Settings()
