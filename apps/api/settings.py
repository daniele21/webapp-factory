"""
Main settings module for the Webapp Factory API.

This module integrates the new configuration system with backward compatibility
for existing code that imports from settings.py.
"""

import os
from typing import Any, Dict, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

from config.base import Environment
from config.auth import AuthConfig, get_auth_config
from config.database import DatabaseConfig, get_database_config
from config.features import FeatureFlagsConfig, get_feature_flags_config
from config.logging import LoggingConfig, get_logging_config

# Import environment-specific configurations
from config.environments import (
    get_development_config,
    get_testing_config,
    get_production_config,
    validate_production_config
)

# Dynamically choose an env file so developers can keep per-environment files like
# `.env.development` without having to copy them to `.env` every time. The
# precedence is:
#  1. APP_ENVFILE environment variable (explicit path)
#  2. .env.<APP_ENV> in the same folder as this settings module
#  3. .env in the same folder as this settings module
env_dir = os.path.dirname(__file__)
env_name = os.getenv("APP_ENV", "development")
explicit_envfile = os.getenv("APP_ENVFILE")
if explicit_envfile:
    chosen_env = explicit_envfile
else:
    candidate = os.path.join(env_dir, f".env.{env_name}")
    default = os.path.join(env_dir, ".env")
    if os.path.exists(candidate):
        chosen_env = candidate
    elif os.path.exists(default):
        chosen_env = default
    else:
        chosen_env = default

# Load values from the chosen env file into process environment so code that
# relies on os.getenv(...) sees them. This is important because pydantic's
# BaseSettings will populate the Settings instance but does not mutate
# os.environ; existing code in the project frequently reads os.getenv directly.
if chosen_env and os.path.exists(chosen_env):
    try:
        with open(chosen_env, "r") as fh:
            for raw in fh:
                ln = raw.strip()
                if not ln or ln.startswith("#") or "=" not in ln:
                    continue
                k, v = ln.split("=", 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                # Only set env vars that aren't already present in the process
                if k and k not in os.environ:
                    os.environ[k] = v
    except Exception:
        # Don't fail at import time if env file cannot be read; pydantic will
        # still attempt to load values from other sources.
        pass


class Settings(BaseSettings):
    """
    Main settings class that provides backward compatibility
    while integrating with the new configuration system.
    """
    
    # Basic application settings
    PROJECT_NAME: str = "Webapp Factory API"
    API_PREFIX: str = "/api/v1"
    ENV: str = "development"

    # Billing / payments
    stripe_public_key: Optional[str] = None
    stripe_secret_key: Optional[str] = None
    stripe_webhook_secret: Optional[str] = None
    shopify_webhook_secret: Optional[str] = None

    # Feedback / telemetry integrations
    telegram_bot_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    feedback_require_auth: bool = False
    
    # Component configurations (loaded dynamically)
    _auth_config: Optional[AuthConfig] = None
    _database_config: Optional[DatabaseConfig] = None
    _features_config: Optional[FeatureFlagsConfig] = None
    _logging_config: Optional[LoggingConfig] = None
    _environment_config: Optional[Dict[str, Any]] = None
    
    model_config = SettingsConfigDict(
        env_file=chosen_env,
        env_prefix="APP_",
        case_sensitive=False,
        extra="ignore",
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._load_configurations()
    
    def _load_configurations(self):
        """Load all component configurations based on environment."""
        environment = self._get_environment()
        
        # Load component configurations
        self._auth_config = get_auth_config()
        self._auth_config.environment = environment
        
        self._database_config = get_database_config()
        self._database_config.environment = environment
        
        self._features_config = get_feature_flags_config()
        self._features_config.environment = environment
        
        self._logging_config = get_logging_config()
        self._logging_config.environment = environment
        
        # Load environment-specific configuration
        if environment == Environment.DEVELOPMENT:
            self._environment_config = get_development_config()
        elif environment == Environment.TESTING:
            self._environment_config = get_testing_config()
        elif environment == Environment.PRODUCTION:
            self._environment_config = get_production_config()
        else:
            self._environment_config = get_development_config()
    
    def _get_environment(self) -> Environment:
        """Get the current environment."""
        env_str = self.ENV.lower()
        if env_str in ["dev", "development"]:
            return Environment.DEVELOPMENT
        elif env_str in ["test", "testing"]:
            return Environment.TESTING
        elif env_str in ["prod", "production"]:
            return Environment.PRODUCTION
        elif env_str == "staging":
            return Environment.STAGING
        else:
            return Environment.DEVELOPMENT
    
    # Backward compatibility properties for existing code
    
    @property
    def GOOGLE_CLIENT_ID(self) -> str:
        """Google OAuth client ID (backward compatibility)."""
        if self._auth_config and self._auth_config.google_oauth:
            return self._auth_config.google_oauth.client_id
        # Return None when not configured so callers can detect a missing
        # configuration instead of silently using a placeholder value.
        return os.getenv("APP_GOOGLE_CLIENT_ID", None)
    
    @property
    def GOOGLE_CLIENT_SECRET(self) -> str:
        """Google OAuth client secret (backward compatibility)."""
        if self._auth_config and self._auth_config.google_oauth:
            return self._auth_config.google_oauth.client_secret
        return os.getenv("APP_GOOGLE_CLIENT_SECRET", None)
    
    @property
    def OAUTH_REDIRECT_URI(self) -> str:
        """OAuth redirect URI (backward compatibility)."""
        if self._auth_config:
            return self._auth_config.oauth_redirect_uri
        # Do not provide a hardcoded default here; prefer explicit configuration via env or auth config.
        return os.getenv("APP_OAUTH_REDIRECT_URI")
    
    @property
    def GOOGLE_PROJECT_ID(self) -> str:
        """Google Cloud Project ID (backward compatibility)."""
        if self._database_config:
            return self._database_config.firestore.project_id
        return os.getenv("APP_GOOGLE_PROJECT_ID", "webapp-factory-dev")
    
    @property
    def JWT_SECRET_KEY(self) -> str:
        """JWT secret key (backward compatibility)."""
        if self._auth_config:
            return self._auth_config.jwt.secret_key
        return os.getenv("APP_JWT_SECRET_KEY", "test-secret-key-for-development-only")
    
    @property
    def JWT_ALGORITHM(self) -> str:
        """JWT algorithm (backward compatibility)."""
        if self._auth_config:
            return self._auth_config.jwt.algorithm
        return os.getenv("APP_JWT_ALGORITHM", "HS256")
    
    @property
    def JWT_ACCESS_TOKEN_EXPIRE_MINUTES(self) -> int:
        """JWT access token expiration (backward compatibility)."""
        if self._auth_config:
            return self._auth_config.jwt.access_token_expire_minutes
        return int(os.getenv("APP_JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
    
    @property
    def JWT_AUDIENCE(self) -> str:
        """JWT audience (backward compatibility)."""
        if self._auth_config:
            return self._auth_config.jwt.audience
        return os.getenv("APP_JWT_AUDIENCE", "webapp-factory")
    
    @property
    def JWT_ISSUER(self) -> str:
        """JWT issuer (backward compatibility)."""
        if self._auth_config:
            return self._auth_config.jwt.issuer
        return os.getenv("APP_JWT_ISSUER", "webapp-factory-api")
    
    @property
    def cors_origins(self) -> list[str]:
        """CORS origins (backward compatibility)."""
        if self._auth_config:
            return self._auth_config.cors_origins
        return [
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://localhost:8080"
        ]
    
    # Legacy properties for backward compatibility
    @property
    def JWT_SECRET(self) -> str:
        """Legacy JWT secret (backward compatibility)."""
        return self.JWT_SECRET_KEY
    
    @property
    def JWT_ALG(self) -> str:
        """Legacy JWT algorithm (backward compatibility)."""
        return self.JWT_ALGORITHM
    
    @property
    def ACCESS_EXPIRES_MIN(self) -> int:
        """Legacy access token expiration (backward compatibility)."""
        return self.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    
    @property
    def REFRESH_EXPIRES_DAYS(self) -> int:
        """Legacy refresh token expiration (backward compatibility)."""
        if self._auth_config:
            return self._auth_config.jwt.refresh_token_expire_days
        return 30
    
    @property
    def COOKIE_DOMAIN(self) -> Optional[str]:
        """Cookie domain (backward compatibility)."""
        if self._auth_config:
            return self._auth_config.cookie_domain
        return None
    
    @property
    def COOKIE_SECURE(self) -> bool:
        """Cookie secure flag (backward compatibility)."""
        if self._auth_config:
            return self._auth_config.cookie_secure
        return False
    
    @property
    def BASE_URL(self) -> str:
        """Base API URL (backward compatibility)."""
        if self._environment_config:
            return self._environment_config.get("api_base_url", "http://localhost:8000")
        # Do not hardcode base URL; require APP_BASE_URL in environment or environment config.
        return os.getenv("APP_BASE_URL")
    
    @property
    def FRONTEND_BASE_URL(self) -> str:
        """Frontend base URL (backward compatibility)."""
        if self._environment_config:
            return self._environment_config.get("frontend_base_url", "http://127.0.0.1:5173")
        # Do not hardcode frontend URL; prefer explicit APP_FRONTEND_BASE_URL setting.
        return os.getenv("APP_FRONTEND_BASE_URL")

    @property
    def TELEGRAM_BOT_TOKEN(self) -> Optional[str]:
        """Telegram bot token for feedback delivery (backward compatibility)."""
        return self.telegram_bot_token or os.getenv("APP_TELEGRAM_BOT_TOKEN")

    @property
    def TELEGRAM_CHAT_ID(self) -> Optional[str]:
        """Telegram chat identifier for feedback delivery (backward compatibility)."""
        return self.telegram_chat_id or os.getenv("APP_TELEGRAM_CHAT_ID")

    @property
    def FEEDBACK_REQUIRE_AUTH(self) -> bool:
        """Whether feedback submissions require authentication."""
        return bool(self.feedback_require_auth or os.getenv("APP_FEEDBACK_REQUIRE_AUTH", "").lower() in {"1", "true", "yes", "on"})
    
    # New configuration access methods
    
    @property
    def auth(self) -> AuthConfig:
        """Get authentication configuration."""
        return self._auth_config or get_auth_config()

    @property
    def auth_config(self) -> AuthConfig:
        """Backward-compatible alias for auth configuration."""
        return self.auth
    
    @property
    def database(self) -> DatabaseConfig:
        """Get database configuration."""
        return self._database_config or get_database_config()
    
    @property
    def features(self) -> FeatureFlagsConfig:
        """Get feature flags configuration."""
        return self._features_config or get_feature_flags_config()
    
    @property
    def logging(self) -> LoggingConfig:
        """Get logging configuration."""
        return self._logging_config or get_logging_config()
    
    @property
    def environment_config(self) -> Dict[str, Any]:
        """Get environment-specific configuration."""
        return self._environment_config or {}
    
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self._get_environment() == Environment.DEVELOPMENT
    
    def is_testing(self) -> bool:
        """Check if running in testing environment."""
        return self._get_environment() == Environment.TESTING
    
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self._get_environment() == Environment.PRODUCTION
    
    def validate_configuration(self) -> list[str]:
        """Validate the current configuration and return issues."""
        issues = []
        
        if self.is_production():
            # Validate production configuration
            if self._environment_config:
                prod_issues = validate_production_config(self._environment_config)
                issues.extend(prod_issues)
            
            # Additional validation
            if self.JWT_SECRET_KEY == "test-secret-key-for-development-only":
                issues.append("JWT secret key must be changed for production")
            
            if not self.BASE_URL.startswith("https://"):
                issues.append("Base URL must use HTTPS in production")
        
        return issues
    
    def reload_configuration(self):
        """Reload all configurations from environment variables."""
        self._load_configurations()


# Create global settings instance
settings = Settings()


# Validate configuration on startup
if settings.is_production():
    config_issues = settings.validate_configuration()
    if config_issues:
        import warnings
        for issue in config_issues:
            warnings.warn(f"Configuration issue: {issue}", UserWarning)


# Export commonly used configuration objects for convenience
auth_config = settings.auth
database_config = settings.database
features_config = settings.features
logging_config = settings.logging
