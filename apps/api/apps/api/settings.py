from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    project_id: str = "dev-project"
    google_client_id: str
    google_client_secret: str
    oauth_redirect_url: str = "http://localhost:5173"
    jwt_secret: str
    redis_url: str = "redis://localhost:6379/0"
    rate_limit_per_minute: int = 120
    stripe_public_key: str | None = None
    stripe_secret_key: str | None = None
    stripe_webhook_secret: str | None = None
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])

    class Config:
        env_file = ".env"

settings = Settings()
