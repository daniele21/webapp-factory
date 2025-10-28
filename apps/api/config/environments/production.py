"""
Production environment configuration.

This configuration is optimized for production deployment with:
- Enhanced security settings
- Production-grade logging and monitoring
- Performance optimizations
- Secure defaults
"""

from config.auth import AuthConfig, JWTConfig, SecurityPolicyConfig, GoogleOAuthConfig
from config.database import DatabaseConfig, get_production_config as get_prod_db_config
from config.features import FeatureFlagsConfig, get_production_flags_config
from config.logging import LoggingConfig, get_production_logging_config
from config.base import Environment


def get_production_config() -> dict:
    """Get complete production configuration."""
    
    # Authentication configuration
    auth_config = AuthConfig(environment=Environment.PRODUCTION)
    
    # JWT settings for production - these MUST be overridden via environment variables
    auth_config.jwt = JWTConfig(
        secret_key="CHANGE-THIS-IN-PRODUCTION-VIA-ENV-VARS",  # Must be overridden
        algorithm="HS256",
        access_token_expire_minutes=15,  # Short expiration for security
        refresh_token_expire_days=30,
        issuer="webapp-factory-api",
        audience="webapp-factory-app"
    )
    
    # Production security settings
    auth_config.security_policy = SecurityPolicyConfig(
        min_password_length=12,
        require_password_uppercase=True,
        require_password_lowercase=True,
        require_password_numbers=True,
        require_password_special_chars=True,
        max_login_attempts=3,
        lockout_duration_minutes=30,
        mfa_enabled=True,
        mfa_required_for_admin=True,
        max_sessions_per_user=3,
        session_timeout_minutes=30
    )
    
    # Production OAuth settings - must be configured via env vars
    auth_config.google_oauth = GoogleOAuthConfig(
        client_id="GOOGLE_CLIENT_ID_FROM_ENV",  # Must be overridden
        client_secret="GOOGLE_CLIENT_SECRET_FROM_ENV",  # Must be overridden
    )
    
    # Production URLs - must be configured via env vars
    auth_config.oauth_redirect_uri = "https://app.yourdomain.com/auth/callback"
    auth_config.cors_origins = [
        "https://yourdomain.com",
        "https://app.yourdomain.com",
        "https://www.yourdomain.com",
    ]
    
    # Secure cookie settings for production
    auth_config.cookie_domain = "yourdomain.com"
    auth_config.cookie_secure = True  # HTTPS only
    auth_config.cookie_httponly = True
    auth_config.cookie_samesite = "strict"
    
    return {
        "environment": Environment.PRODUCTION,
        "auth": auth_config,
        "database": get_prod_db_config(),
        "features": get_production_flags_config(),
        "logging": get_production_logging_config(),
        
        # Production-specific settings
        "debug": False,
        "reload": False,
        "cors_allow_all": False,
        "api_docs_enabled": False,  # Disable in production for security
        "profiling_enabled": False,
        
        # Production URLs - must be overridden via env vars
        "api_base_url": "https://api.yourdomain.com",
        "frontend_base_url": "https://app.yourdomain.com",
        
        # Production ports
        "api_port": 8000,
        "metrics_port": 8090,
        
        # Security settings
        "hsts_enabled": True,
        "csp_enabled": True,
        "rate_limiting_enabled": True,
        
        # Performance settings
        "workers": 4,
        "max_requests": 1000,
        "max_requests_jitter": 100,
        "keepalive": 2,
        
        # Health checks
        "health_check_enabled": True,
        "health_check_interval": 30,
        
        # Backup and maintenance
        "backup_enabled": True,
        "maintenance_mode": False,
    }


# Production environment variables template
PRODUCTION_ENV_TEMPLATE = """
# Production Environment Configuration
# SECURITY WARNING: Keep this file secure and never commit secrets to version control

# Environment
APP_ENV=production

# API Settings
APP_DEBUG=false
APP_RELOAD=false
APP_API_PORT=8000
APP_WORKERS=4

# JWT Authentication - CHANGE THESE VALUES
APP_JWT_SECRET_KEY=your-super-secure-256-bit-secret-key-change-this-immediately
APP_JWT_ALGORITHM=HS256
APP_JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
APP_JWT_AUDIENCE=webapp-factory-app
APP_JWT_ISSUER=webapp-factory-api

# OAuth Configuration - CHANGE THESE VALUES
APP_GOOGLE_CLIENT_ID=your-google-oauth-client-id
APP_GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
APP_OAUTH_REDIRECT_URI=https://app.yourdomain.com/auth/callback

# Database Configuration - CHANGE THESE VALUES
APP_GOOGLE_PROJECT_ID=your-production-project-id
APP_FIRESTORE_EMULATOR_HOST=
APP_USE_FIRESTORE_EMULATOR=false

# Redis Configuration - CHANGE THESE VALUES
APP_REDIS_URL=redis://your-redis-host:6379
APP_REDIS_PASSWORD=your-redis-password
APP_REDIS_DATABASE=0

# URLs - CHANGE THESE VALUES
APP_BASE_URL=https://api.yourdomain.com
APP_FRONTEND_BASE_URL=https://app.yourdomain.com

# Cookie Settings
APP_COOKIE_DOMAIN=yourdomain.com
APP_COOKIE_SECURE=true

# CORS Origins - CHANGE THESE VALUES
APP_CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com,https://www.yourdomain.com

# Logging
APP_LOG_LEVEL=INFO
APP_LOG_FORMAT=json
APP_LOG_REQUESTS=true
APP_LOG_FILE=/var/log/webapp-factory/api.log

# Monitoring
APP_METRICS_ENABLED=true
APP_TRACING_ENABLED=true
APP_SENTRY_DSN=your-sentry-dsn
APP_SENTRY_ENVIRONMENT=production

# Features
APP_FEATURE_FLAGS_STORAGE=firestore
APP_ADMIN_API_ENABLED=true
APP_ADMIN_API_AUTH_REQUIRED=true

# Security
APP_HSTS_ENABLED=true
APP_CSP_ENABLED=true
APP_RATE_LIMITING_ENABLED=true

# Performance
APP_MAX_REQUESTS=1000
APP_MAX_REQUESTS_JITTER=100
APP_KEEPALIVE=2

# Health Checks
APP_HEALTH_CHECK_ENABLED=true
APP_HEALTH_CHECK_INTERVAL=30

# Backup
APP_BACKUP_ENABLED=true
APP_BACKUP_INTERVAL_HOURS=12
APP_BACKUP_RETENTION_DAYS=90
"""

def write_production_env_file(path: str = ".env.production") -> None:
    """Write production environment template to file."""
    with open(path, "w") as f:
        f.write(PRODUCTION_ENV_TEMPLATE.strip())


def validate_production_config(config: dict) -> list[str]:
    """Validate production configuration for security and completeness."""
    issues = []
    
    auth_config = config.get("auth")
    if auth_config:
        # Check JWT secret
        if auth_config.jwt.secret_key == "CHANGE-THIS-IN-PRODUCTION-VIA-ENV-VARS":
            issues.append("JWT secret key must be changed from default value")
        
        if len(auth_config.jwt.secret_key) < 64:
            issues.append("JWT secret key should be at least 64 characters for production")
        
        # Check OAuth configuration
        if auth_config.google_oauth:
            if auth_config.google_oauth.client_id == "GOOGLE_CLIENT_ID_FROM_ENV":
                issues.append("Google OAuth client ID must be configured")
            if auth_config.google_oauth.client_secret == "GOOGLE_CLIENT_SECRET_FROM_ENV":
                issues.append("Google OAuth client secret must be configured")
        
        # Check security settings
        if not auth_config.cookie_secure:
            issues.append("Secure cookies must be enabled in production")
        
        if auth_config.cookie_samesite != "strict":
            issues.append("Consider using 'strict' SameSite cookie policy in production")
    
    # Check URLs
    api_url = config.get("api_base_url", "")
    frontend_url = config.get("frontend_base_url", "")
    
    if not api_url.startswith("https://"):
        issues.append("API base URL must use HTTPS in production")
    
    if not frontend_url.startswith("https://"):
        issues.append("Frontend base URL must use HTTPS in production")
    
    if "yourdomain.com" in api_url or "yourdomain.com" in frontend_url:
        issues.append("Default domain names must be changed for production")
    
    # Check database configuration
    db_config = config.get("database")
    if db_config:
        if db_config.firestore.use_emulator:
            issues.append("Firestore emulator should not be used in production")
        
        if db_config.redis.url == "redis://localhost:6379":
            issues.append("Redis URL must be configured for production")
    
    # Check security features
    if not config.get("hsts_enabled", False):
        issues.append("HSTS should be enabled in production")
    
    if not config.get("rate_limiting_enabled", False):
        issues.append("Rate limiting should be enabled in production")
    
    if config.get("api_docs_enabled", True):
        issues.append("API documentation should be disabled in production")
    
    return issues