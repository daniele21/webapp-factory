from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Webapp Factory API"
    API_PREFIX: str = "/api/v1"
    ENV: str = "dev"

    # Google OAuth
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    OAUTH_REDIRECT_URI: str  # e.g. http://localhost:5173/auth/callback

    # Firestore
    GOOGLE_PROJECT_ID: str
    # For emulator: FIRESTORE_EMULATOR_HOST=localhost:8080 (no scheme)

    # JWT
    JWT_SECRET: str
    JWT_ALG: str = "HS256"
    ACCESS_EXPIRES_MIN: int = 30
    REFRESH_EXPIRES_DAYS: int = 14
    COOKIE_DOMAIN: str | None = None  # e.g. "localhost"
    COOKIE_SECURE: bool = False       # True in prod

    model_config = SettingsConfigDict(env_file=".env", env_prefix="APP_")

settings = Settings()
