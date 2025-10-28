"""
Testing environment configuration.

This configuration is optimized for automated testing with:
- Minimal logging
- In-memory storage
- Fast test execution
- Isolated test data
"""

from config.auth import AuthConfig, JWTConfig, SecurityPolicyConfig
from config.database import DatabaseConfig, get_testing_config as get_test_db_config
from config.features import FeatureFlagsConfig, get_testing_flags_config
from config.logging import LoggingConfig, get_testing_logging_config
from config.base import Environment


def get_testing_config() -> dict:
    """Get complete testing configuration."""
    
    # Authentication configuration
    auth_config = AuthConfig(environment=Environment.TESTING)
    
    # JWT settings for testing
    auth_config.jwt = JWTConfig(
        secret_key="test-secret-key-for-automated-testing-only",
        algorithm="HS256",
        access_token_expire_minutes=5,  # Short expiration for tests
        refresh_token_expire_days=1,
        issuer="webapp-factory-test",
        audience="webapp-factory-test-app"
    )
    
    # Minimal security requirements for tests
    auth_config.security_policy = SecurityPolicyConfig(
        min_password_length=6,
        require_password_uppercase=False,
        require_password_lowercase=False,
        require_password_numbers=False,
        max_login_attempts=3,
        lockout_duration_minutes=1,
        mfa_enabled=False,
        mfa_required_for_admin=False,
        max_sessions_per_user=10,
        session_timeout_minutes=30
    )
    
    # Test OAuth settings
    auth_config.oauth_redirect_uri = "http://localhost:8000/auth/callback"
    auth_config.cors_origins = ["http://localhost:8000"]
    
    # Test cookie settings
    auth_config.cookie_domain = None
    auth_config.cookie_secure = False
    auth_config.cookie_httponly = True
    auth_config.cookie_samesite = "lax"
    
    return {
        "environment": Environment.TESTING,
        "auth": auth_config,
        "database": get_test_db_config(),
        "features": get_testing_flags_config(),
        "logging": get_testing_logging_config(),
        
        # Testing-specific settings
        "debug": False,
        "reload": False,
        "cors_allow_all": True,
        "api_docs_enabled": False,
        "profiling_enabled": False,
        
        # Test URLs
        "api_base_url": "http://localhost:8000",
        "frontend_base_url": "http://localhost:8000",
        
        # Test ports
        "api_port": 8000,
        "metrics_port": 8091,
        
        # Test data isolation
        "test_database_suffix": "_test",
        "cleanup_after_tests": True,
    }


# Testing environment variables template
TESTING_ENV_TEMPLATE = """
# Testing Environment Configuration
# Used for automated tests and CI/CD

# Environment
APP_ENV=testing

# API Settings
APP_DEBUG=false
APP_RELOAD=false
APP_API_PORT=8000

# JWT Authentication
APP_JWT_SECRET_KEY=test-secret-key-for-automated-testing-only
APP_JWT_ALGORITHM=HS256
APP_JWT_ACCESS_TOKEN_EXPIRE_MINUTES=5
APP_JWT_AUDIENCE=webapp-factory-test
APP_JWT_ISSUER=webapp-factory-test

# OAuth Configuration (Test credentials)
APP_GOOGLE_CLIENT_ID=test-client-id
APP_GOOGLE_CLIENT_SECRET=test-client-secret
APP_OAUTH_REDIRECT_URI=http://localhost:8000/auth/callback

# Database Configuration
APP_GOOGLE_PROJECT_ID=webapp-factory-test
APP_FIRESTORE_EMULATOR_HOST=localhost:8080
APP_USE_FIRESTORE_EMULATOR=true

# Redis Configuration (Separate DB for tests)
APP_REDIS_URL=redis://localhost:6379
APP_REDIS_DATABASE=1

# URLs
APP_BASE_URL=http://localhost:8000
APP_FRONTEND_BASE_URL=http://localhost:8000

# Logging (Minimal for tests)
APP_LOG_LEVEL=WARNING
APP_LOG_FORMAT=text
APP_LOG_REQUESTS=false

# Features (Memory storage for tests)
APP_FEATURE_FLAGS_STORAGE=memory
APP_METRICS_ENABLED=false
APP_TRACING_ENABLED=false

# Test Settings
APP_API_DOCS_ENABLED=false
APP_PROFILING_ENABLED=false
APP_CLEANUP_AFTER_TESTS=true
"""

def write_testing_env_file(path: str = ".env.testing") -> None:
    """Write testing environment template to file."""
    with open(path, "w") as f:
        f.write(TESTING_ENV_TEMPLATE.strip())