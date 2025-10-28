"""
JSON configuration loader for the Webapp Factory API.

This module allows loading configuration from JSON files in addition to
environment variables and Python configuration files.
"""

import json
import os
import re
from pathlib import Path
from typing import Dict, Any, Optional

from config.auth import AuthConfig, JWTConfig, SecurityPolicyConfig, GoogleOAuthConfig
from config.database import DatabaseConfig, FirestoreConfig, RedisConfig
from config.features import FeatureFlagsConfig, FeatureFlag, FeatureFlagStrategy
from config.logging import LoggingConfig, LogHandler, LogLevel, LogFormat
from config.base import Environment


def expand_env_vars(value: Any) -> Any:
    """
    Recursively expand environment variables in strings.
    Supports ${VAR} and ${VAR:-default} syntax.
    """
    if isinstance(value, str):
        # Match ${VAR} or ${VAR:-default}
        def replacer(match):
            var_expr = match.group(1)
            if ':-' in var_expr:
                var_name, default_value = var_expr.split(':-', 1)
                return os.getenv(var_name.strip(), default_value.strip())
            else:
                return os.getenv(var_expr.strip(), match.group(0))
        
        return re.sub(r'\$\{([^}]+)\}', replacer, value)
    elif isinstance(value, dict):
        return {k: expand_env_vars(v) for k, v in value.items()}
    elif isinstance(value, list):
        return [expand_env_vars(item) for item in value]
    else:
        return value


def load_json_config(config_path: str) -> Dict[str, Any]:
    """Load configuration from JSON file and expand environment variables."""
    path = Path(config_path)
    if not path.exists():
        raise FileNotFoundError(f"Configuration file not found: {config_path}")
    
    with open(path, 'r') as f:
        raw_config = json.load(f)
    
    # Expand environment variables
    return expand_env_vars(raw_config)
    elif isinstance(value, dict):
        return {k: expand_env_vars(v) for k, v in value.items()}
    elif isinstance(value, list):
        return [expand_env_vars(item) for item in value]
    else:
        return value


def load_json_config(config_path: str) -> Dict[str, Any]:
    """Load configuration from JSON file and expand environment variables."""
    path = Path(config_path)
    if not path.exists():
        raise FileNotFoundError(f"Configuration file not found: {config_path}")
    
    with open(path, 'r') as f:
        raw_config = json.load(f)
    
    # Expand environment variables
    return expand_env_vars(raw_config)er for the Webapp Factory API.

This module allows loading configuration from JSON files in addition to
environment variables and Python configuration files.
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, Optional

from config.auth import AuthConfig, JWTConfig, SecurityPolicyConfig, GoogleOAuthConfig
from config.database import DatabaseConfig, FirestoreConfig, RedisConfig
from config.features import FeatureFlagsConfig, FeatureFlag, FeatureFlagStrategy
from config.logging import LoggingConfig, LogHandler, LogLevel, LogFormat
from config.base import Environment


def load_json_config(config_path: str) -> Dict[str, Any]:
    """Load configuration from JSON file."""
    path = Path(config_path)
    if not path.exists():
        raise FileNotFoundError(f"Configuration file not found: {config_path}")
    
    with open(path, 'r') as f:
        return json.load(f)


def json_to_auth_config(json_data: Dict[str, Any]) -> AuthConfig:
    """Convert JSON data to AuthConfig object."""
    auth_data = json_data.get("auth", {})
    
    # JWT configuration
    jwt_data = auth_data.get("jwt", {})
    jwt_config = JWTConfig(
        secret_key=jwt_data.get("secret_key", "dev-secret-key"),
        algorithm=jwt_data.get("algorithm", "HS256"),
        access_token_expire_minutes=jwt_data.get("access_token_expire_minutes", 15),
        refresh_token_expire_days=jwt_data.get("refresh_token_expire_days", 30),
        audience=jwt_data.get("audience", "webapp-factory"),
        issuer=jwt_data.get("issuer", "webapp-factory-api")
    )
    
    # Security policy
    security_data = auth_data.get("security", {})
    security_config = SecurityPolicyConfig(
        min_password_length=security_data.get("min_password_length", 8),
        require_password_uppercase=security_data.get("require_uppercase", True),
        require_password_lowercase=security_data.get("require_lowercase", True),
        require_password_numbers=security_data.get("require_numbers", True),
        require_password_special_chars=security_data.get("require_special_chars", False),
        max_login_attempts=security_data.get("max_login_attempts", 5),
        lockout_duration_minutes=security_data.get("lockout_duration_minutes", 15),
        mfa_enabled=security_data.get("mfa_enabled", False),
        mfa_required_for_admin=security_data.get("mfa_required_for_admin", True)
    )
    
    # Google OAuth
    oauth_data = auth_data.get("oauth", {})
    google_data = oauth_data.get("google", {})
    google_oauth = None
    if google_data:
        google_oauth = GoogleOAuthConfig(
            client_id=google_data.get("client_id", ""),
            client_secret=google_data.get("client_secret", "")
        )
    
    # Cookie settings
    cookies_data = auth_data.get("cookies", {})
    
    # Create auth config
    auth_config = AuthConfig(
        environment=Environment(json_data.get("environment", "development")),
        jwt=jwt_config,
        security_policy=security_config,
        google_oauth=google_oauth,
        oauth_redirect_uri=oauth_data.get("redirect_uri", "http://127.0.0.1:5173/auth/callback"),
        cors_origins=auth_data.get("cors_origins", ["http://localhost:3000"]),
        cookie_domain=cookies_data.get("domain"),
        cookie_secure=cookies_data.get("secure", False),
        cookie_httponly=cookies_data.get("httponly", True),
        cookie_samesite=cookies_data.get("samesite", "lax")
    )
    
    return auth_config


def json_to_database_config(json_data: Dict[str, Any]) -> DatabaseConfig:
    """Convert JSON data to DatabaseConfig object."""
    db_data = json_data.get("database", {})
    
    # Firestore configuration
    firestore_data = db_data.get("firestore", {})
    firestore_config = FirestoreConfig(
        project_id=firestore_data.get("project_id", "webapp-factory-dev"),
        use_emulator=firestore_data.get("use_emulator", False),
        emulator_host=firestore_data.get("emulator_host"),
        timeout_seconds=firestore_data.get("timeout_seconds", 30),
        max_retries=firestore_data.get("max_retries", 3)
    )
    
    # Redis configuration
    redis_data = db_data.get("redis", {})
    redis_config = RedisConfig(
        url=redis_data.get("url", "redis://localhost:6379"),
        database=redis_data.get("database", 0),
        max_connections=redis_data.get("max_connections", 100),
        connection_timeout=redis_data.get("connection_timeout", 5),
        default_ttl=redis_data.get("default_ttl", 3600),
        session_ttl=redis_data.get("session_ttl", 86400)
    )
    
    # Create database config
    db_config = DatabaseConfig(
        environment=Environment(json_data.get("environment", "development")),
        firestore=firestore_config,
        redis=redis_config
    )
    
    return db_config


def json_to_features_config(json_data: Dict[str, Any]) -> FeatureFlagsConfig:
    """Convert JSON data to FeatureFlagsConfig object."""
    features_data = json_data.get("features", {})
    
    # Create features config
    features_config = FeatureFlagsConfig(
        environment=Environment(json_data.get("environment", "development")),
        storage_backend=features_data.get("storage_backend", "memory"),
        cache_ttl_seconds=features_data.get("cache_ttl_seconds", 300),
        strict_mode=features_data.get("strict_mode", False),
        log_evaluations=features_data.get("log_evaluations", True),
        admin_api_enabled=features_data.get("admin_api_enabled", True),
        metrics_enabled=features_data.get("metrics_enabled", True),
        analytics_enabled=features_data.get("analytics_enabled", True)
    )
    
    # Load feature flags
    flags_data = features_data.get("flags", {})
    for flag_key, flag_data in flags_data.items():
        feature_flag = FeatureFlag(
            key=flag_key,
            name=flag_data.get("name", flag_key.replace("_", " ").title()),
            description=flag_data.get("description", ""),
            enabled=flag_data.get("enabled", False),
            strategy=FeatureFlagStrategy(flag_data.get("strategy", "none")),
            percentage=flag_data.get("percentage", 0),
            whitelist_users=flag_data.get("whitelist_users", []),
            blacklist_users=flag_data.get("blacklist_users", [])
        )
        features_config.add_default_flag(feature_flag)
    
    return features_config


def json_to_logging_config(json_data: Dict[str, Any]) -> LoggingConfig:
    """Convert JSON data to LoggingConfig object."""
    logging_data = json_data.get("logging", {})
    
    # Create handlers
    handlers = []
    handlers_data = logging_data.get("handlers", [])
    for handler_data in handlers_data:
        handler = LogHandler(
            name=handler_data.get("name", "default"),
            type=handler_data.get("type", "console"),
            level=LogLevel(handler_data.get("level", "INFO")),
            format=LogFormat(handler_data.get("format", "json")),
            filename=handler_data.get("filename")
        )
        handlers.append(handler)
    
    # Create logging config
    logging_config = LoggingConfig(
        environment=Environment(json_data.get("environment", "development")),
        root_level=LogLevel(logging_data.get("root_level", "INFO")),
        log_format=LogFormat(logging_data.get("format", "json")),
        handlers=handlers,
        log_requests=logging_data.get("log_requests", True),
        log_responses=logging_data.get("log_responses", False),
        log_request_body=logging_data.get("log_request_body", False),
        log_response_body=logging_data.get("log_response_body", False),
        mask_sensitive_data=logging_data.get("mask_sensitive_data", True)
    )
    
    return logging_config


def load_config_from_json(config_path: str) -> Dict[str, Any]:
    """Load complete configuration from JSON file."""
    json_data = load_json_config(config_path)
    
    return {
        "environment": Environment(json_data.get("environment", "development")),
        "auth": json_to_auth_config(json_data),
        "database": json_to_database_config(json_data),
        "features": json_to_features_config(json_data),
        "logging": json_to_logging_config(json_data),
        **json_data.get("urls", {}),
        **json_data.get("api", {})
    }


def export_config_to_json(config: Dict[str, Any], output_path: str) -> None:
    """Export configuration to JSON file."""
    # This would be a more complex function to serialize the config objects back to JSON
    # For now, we'll create a simplified version
    serializable_config = {
        "environment": str(config.get("environment", "development")),
        "api": {
            "debug": config.get("debug", False),
            "port": config.get("api_port", 8000),
            "docs_enabled": config.get("api_docs_enabled", True)
        }
        # Add more serialization as needed
    }
    
    with open(output_path, 'w') as f:
        json.dump(serializable_config, f, indent=2)


# Configuration file discovery
def find_config_file(environment: str = None) -> Optional[str]:
    """Find configuration file for the given environment."""
    if environment is None:
        environment = os.getenv("APP_ENV", "development")
    
    # Look for JSON config files
    possible_paths = [
        f"config.{environment}.json",
        f"config/{environment}.json",
        f"configs/{environment}.json",
        "config.json"
    ]
    
    for path in possible_paths:
        if Path(path).exists():
            return path
    
    return None


# Auto-load configuration
def auto_load_config() -> Optional[Dict[str, Any]]:
    """Automatically load configuration from available files."""
    config_file = find_config_file()
    if config_file:
        print(f"Loading configuration from: {config_file}")
        return load_config_from_json(config_file)
    
    return None