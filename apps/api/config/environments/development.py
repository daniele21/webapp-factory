"""
Development environment configuration.

This configuration is optimized for local development with:
- Debug logging enabled
- Local services (Firestore emulator, Redis)
- Relaxed security settings
- Enhanced debugging features
"""

from config.auth import AuthConfig, JWTConfig, SecurityPolicyConfig
from config.database import DatabaseConfig, get_development_config as get_dev_db_config
from config.features import FeatureFlagsConfig, get_development_flags_config
from config.logging import LoggingConfig, get_development_logging_config
from config.base import Environment


def get_development_config() -> dict:
    """Get complete development configuration."""
    
    # Authentication configuration
    auth_config = AuthConfig(environment=Environment.DEVELOPMENT)
    
    # JWT settings for development
    auth_config.jwt = JWTConfig(
        secret_key="dev-secret-key-not-for-production-use-only",
        algorithm="HS256",
        access_token_expire_minutes=60,  # Longer expiration for dev
        refresh_token_expire_days=7,
        issuer="webapp-factory-dev",
        audience="webapp-factory-dev-app"
    )
    
    # Relaxed security for development
    auth_config.security_policy = SecurityPolicyConfig(
        min_password_length=6,  # Minimum allowed by SecurityPolicyConfig validator
        require_password_uppercase=False,
        require_password_lowercase=False,
        require_password_numbers=False,
        max_login_attempts=10,  # More attempts for dev
        lockout_duration_minutes=5,  # Shorter lockout
        mfa_enabled=False,
        mfa_required_for_admin=False
    )
    
    # Development OAuth settings
    auth_config.oauth_redirect_uri = "http://127.0.0.1:5173/auth/callback"
    auth_config.cors_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://localhost:8000",  # API docs
    ]
    
    # Cookie settings for localhost
    auth_config.cookie_domain = "localhost"
    auth_config.cookie_secure = False
    auth_config.cookie_httponly = True
    auth_config.cookie_samesite = "lax"
    
    return {
        "environment": Environment.DEVELOPMENT,
        "auth": auth_config,
        "database": get_dev_db_config(),
        "features": get_development_flags_config(),
        "logging": get_development_logging_config(),
        
        # Development-specific settings
        "debug": True,
        "reload": True,
        "cors_allow_all": True,
        "api_docs_enabled": True,
        "profiling_enabled": True,
        
        # Development URLs
        "api_base_url": "http://localhost:8000",
        "frontend_base_url": "http://127.0.0.1:5173",
        
        # Development ports
        "api_port": 8000,
        "metrics_port": 8090,
        "debug_port": 5678,
    }


# Development environment variables template
DEVELOPMENT_ENV_TEMPLATE = """
# Development Environment Configuration
# Copy this to .env and customize as needed

# Environment
APP_ENV=development

# API Settings
APP_DEBUG=true
APP_RELOAD=true
APP_API_PORT=8000

# JWT Authentication
APP_JWT_SECRET_KEY=dev-secret-key-not-for-production-use-only
APP_JWT_ALGORITHM=HS256
APP_JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
APP_JWT_AUDIENCE=webapp-factory-dev
APP_JWT_ISSUER=webapp-factory-dev

# OAuth Configuration
APP_GOOGLE_CLIENT_ID=your-google-client-id
APP_GOOGLE_CLIENT_SECRET=your-google-client-secret
APP_OAUTH_REDIRECT_URI=http://127.0.0.1:5173/auth/callback

# Database Configuration
APP_GOOGLE_PROJECT_ID=webapp-factory-dev
APP_FIRESTORE_EMULATOR_HOST=localhost:8080
APP_USE_FIRESTORE_EMULATOR=true

# Redis Configuration
APP_REDIS_URL=redis://localhost:6379
APP_REDIS_DATABASE=0

# URLs
APP_BASE_URL=http://localhost:8000
APP_FRONTEND_BASE_URL=http://127.0.0.1:5173

# Logging
APP_LOG_LEVEL=DEBUG
APP_LOG_FORMAT=text
APP_LOG_REQUESTS=true

# Features
APP_FEATURE_FLAGS_STORAGE=memory
APP_METRICS_ENABLED=true
APP_TRACING_ENABLED=true

# Development Tools
APP_API_DOCS_ENABLED=true
APP_PROFILING_ENABLED=true
"""

def write_development_env_file(path: str = ".env.development") -> None:
    """Write development environment template to file."""
    with open(path, "w") as f:
        f.write(DEVELOPMENT_ENV_TEMPLATE.strip())