"""
Database configuration for the Webapp Factory API.

This module contains configuration for all database connections including:
- Firestore (document database)
- Redis (caching and sessions)
- Connection pooling
- Environment-specific settings
"""

from typing import Optional, Dict, Any, List
from pydantic import Field, validator
from .base import BaseConfig, Environment


class FirestoreConfig(BaseConfig):
    """Google Firestore configuration."""
    
    # Project settings
    project_id: str = Field(
        default="webapp-factory-dev",
        description="Google Cloud Project ID"
    )
    
    # Authentication
    credentials_path: Optional[str] = Field(
        default=None,
        description="Path to service account key file"
    )
    
    # Emulator settings (for development/testing)
    emulator_host: Optional[str] = Field(
        default=None,
        description="Firestore emulator host (e.g., localhost:8080)"
    )
    
    use_emulator: bool = Field(
        default=False,
        description="Use Firestore emulator instead of cloud"
    )
    
    # Database settings
    database_id: str = Field(
        default="(default)",
        description="Firestore database ID"
    )
    
    # Collection names
    collections: Dict[str, str] = Field(
        default_factory=lambda: {
            "users": "users",
            "organizations": "organizations", 
            "sessions": "sessions",
            "audit_logs": "audit_logs",
            "feature_flags": "feature_flags",
        },
        description="Firestore collection names"
    )
    
    # Connection settings
    timeout_seconds: int = Field(
        default=30,
        description="Request timeout in seconds",
        ge=1,
        le=300
    )
    
    max_retries: int = Field(
        default=3,
        description="Maximum number of retries for failed requests",
        ge=0,
        le=10
    )
    
    @validator('emulator_host')
    def validate_emulator_host(cls, v):
        """Validate emulator host format."""
        if v and '://' in v:
            raise ValueError("Emulator host should not include protocol (use 'localhost:8080', not 'http://localhost:8080')")
        return v


class RedisConfig(BaseConfig):
    """Redis configuration for caching and sessions."""
    
    # Connection settings
    url: str = Field(
        default="redis://localhost:6379",
        description="Redis connection URL"
    )
    
    host: str = Field(
        default="localhost",
        description="Redis host"
    )
    
    port: int = Field(
        default=6379,
        description="Redis port",
        ge=1,
        le=65535
    )
    
    database: int = Field(
        default=0,
        description="Redis database number",
        ge=0,
        le=15
    )
    
    # Authentication
    password: Optional[str] = Field(
        default=None,
        description="Redis password"
    )
    
    username: Optional[str] = Field(
        default=None,
        description="Redis username (Redis 6.0+)"
    )
    
    # Connection pool settings
    max_connections: int = Field(
        default=100,
        description="Maximum connections in pool",
        ge=1,
        le=1000
    )
    
    connection_timeout: int = Field(
        default=5,
        description="Connection timeout in seconds",
        ge=1,
        le=60
    )
    
    socket_timeout: int = Field(
        default=5,
        description="Socket timeout in seconds",
        ge=1,
        le=60
    )
    
    # Retry settings
    retry_on_timeout: bool = Field(
        default=True,
        description="Retry on timeout errors"
    )
    
    max_retries: int = Field(
        default=3,
        description="Maximum retry attempts",
        ge=0,
        le=10
    )
    
    # Key prefixes
    key_prefixes: Dict[str, str] = Field(
        default_factory=lambda: {
            "session": "session:",
            "cache": "cache:",
            "rate_limit": "rate_limit:",
            "auth": "auth:",
            "temp": "temp:",
        },
        description="Redis key prefixes for different data types"
    )
    
    # TTL settings (in seconds)
    default_ttl: int = Field(
        default=3600,  # 1 hour
        description="Default TTL for cached items",
        ge=1
    )
    
    session_ttl: int = Field(
        default=86400,  # 24 hours
        description="TTL for session data",
        ge=60
    )
    
    rate_limit_ttl: int = Field(
        default=3600,  # 1 hour
        description="TTL for rate limit counters",
        ge=1
    )


class DatabasePoolConfig(BaseConfig):
    """Database connection pooling configuration."""
    
    # Pool sizes
    min_pool_size: int = Field(
        default=5,
        description="Minimum connections to maintain",
        ge=1
    )
    
    max_pool_size: int = Field(
        default=20,
        description="Maximum connections allowed",
        ge=1
    )
    
    # Connection lifecycle
    max_idle_time: int = Field(
        default=300,  # 5 minutes
        description="Maximum idle time before closing connection",
        ge=60
    )
    
    connection_timeout: int = Field(
        default=30,
        description="Timeout for getting connection from pool",
        ge=1
    )
    
    # Health checks
    health_check_interval: int = Field(
        default=60,  # 1 minute
        description="Health check interval in seconds",
        ge=10
    )
    
    @validator('max_pool_size')
    def validate_pool_sizes(cls, v, values):
        """Ensure max pool size is greater than min pool size."""
        min_size = values.get('min_pool_size', 1)
        if v <= min_size:
            raise ValueError("max_pool_size must be greater than min_pool_size")
        return v


class DatabaseConfig(BaseConfig):
    """Main database configuration."""
    
    environment: Environment = Field(
        default=Environment.DEVELOPMENT,
        description="Application environment"
    )
    
    # Component configurations
    firestore: FirestoreConfig = Field(default_factory=FirestoreConfig)
    redis: RedisConfig = Field(default_factory=RedisConfig)
    pool: DatabasePoolConfig = Field(default_factory=DatabasePoolConfig)
    
    # Feature flags
    enable_firestore: bool = Field(
        default=True,
        description="Enable Firestore connections"
    )
    
    enable_redis: bool = Field(
        default=True,
        description="Enable Redis connections"
    )
    
    enable_connection_pooling: bool = Field(
        default=True,
        description="Enable connection pooling"
    )
    
    # Migration settings
    auto_migrate: bool = Field(
        default=False,
        description="Automatically run database migrations on startup"
    )
    
    migration_timeout: int = Field(
        default=300,  # 5 minutes
        description="Migration timeout in seconds",
        ge=60
    )
    
    # Backup settings
    backup_enabled: bool = Field(
        default=False,
        description="Enable automatic backups"
    )
    
    backup_interval_hours: int = Field(
        default=24,
        description="Backup interval in hours",
        ge=1
    )
    
    backup_retention_days: int = Field(
        default=30,
        description="Backup retention period in days",
        ge=1
    )
    
    def get_firestore_client_config(self) -> Dict[str, Any]:
        """Get Firestore client configuration."""
        config = {
            "project": self.firestore.project_id,
            "database": self.firestore.database_id,
        }
        
        if self.firestore.credentials_path:
            config["credentials_path"] = self.firestore.credentials_path
        
        if self.firestore.use_emulator and self.firestore.emulator_host:
            config["emulator_host"] = self.firestore.emulator_host
        
        return config
    
    def get_redis_client_config(self) -> Dict[str, Any]:
        """Get Redis client configuration."""
        config = {
            "host": self.redis.host,
            "port": self.redis.port,
            "db": self.redis.database,
            "socket_timeout": self.redis.socket_timeout,
            "socket_connect_timeout": self.redis.connection_timeout,
            "retry_on_timeout": self.redis.retry_on_timeout,
            "max_connections": self.redis.max_connections,
        }
        
        if self.redis.password:
            config["password"] = self.redis.password
        
        if self.redis.username:
            config["username"] = self.redis.username
        
        return config
    
    def is_production_ready(self) -> bool:
        """Check if database configuration is ready for production."""
        if self.environment != Environment.PRODUCTION:
            return True
        
        # Check Firestore settings
        if self.enable_firestore:
            if self.firestore.use_emulator:
                return False
            if self.firestore.project_id == "webapp-factory-dev":
                return False
        
        # Check Redis settings
        if self.enable_redis:
            if self.redis.url == "redis://localhost:6379":
                return False
            if not self.redis.password and self.environment == Environment.PRODUCTION:
                return False
        
        return True


# Configuration factories
def get_database_config() -> DatabaseConfig:
    """Get database configuration from environment variables."""
    return DatabaseConfig()


def get_firestore_config() -> FirestoreConfig:
    """Get Firestore configuration from environment variables."""
    return FirestoreConfig()


def get_redis_config() -> RedisConfig:
    """Get Redis configuration from environment variables."""
    return RedisConfig()


# Environment-specific configurations
def get_development_config() -> DatabaseConfig:
    """Get development database configuration."""
    config = DatabaseConfig(environment=Environment.DEVELOPMENT)
    
    # Use emulator for development
    config.firestore.use_emulator = True
    config.firestore.emulator_host = "localhost:8080"
    config.firestore.project_id = "webapp-factory-dev"
    
    # Local Redis
    config.redis.url = "redis://localhost:6379"
    config.redis.database = 0
    
    return config


def get_testing_config() -> DatabaseConfig:
    """Get testing database configuration."""
    config = DatabaseConfig(environment=Environment.TESTING)
    
    # Use emulator for testing
    config.firestore.use_emulator = True
    config.firestore.emulator_host = "localhost:8080"
    config.firestore.project_id = "webapp-factory-test"
    
    # Separate Redis database for tests
    config.redis.url = "redis://localhost:6379"
    config.redis.database = 1  # Use different database
    
    # Shorter TTLs for testing
    config.redis.default_ttl = 300  # 5 minutes
    config.redis.session_ttl = 600  # 10 minutes
    
    return config


def get_production_config() -> DatabaseConfig:
    """Get production database configuration template."""
    config = DatabaseConfig(environment=Environment.PRODUCTION)
    
    # Production Firestore
    config.firestore.use_emulator = False
    config.firestore.project_id = "webapp-factory-prod"  # Override via env vars
    
    # Production Redis
    config.redis.url = "redis://prod-redis:6379"  # Override via env vars
    config.redis.database = 0
    
    # Enable backups
    config.backup_enabled = True
    config.backup_interval_hours = 12
    config.backup_retention_days = 90
    
    return config


# Configuration validation
def validate_database_config(config: DatabaseConfig) -> List[str]:
    """Validate database configuration and return list of issues."""
    issues = []
    
    if config.environment == Environment.PRODUCTION:
        if not config.is_production_ready():
            issues.append("Database configuration is not production ready")
        
        if config.firestore.use_emulator:
            issues.append("Firestore emulator should not be used in production")
        
        if config.redis.url == "redis://localhost:6379":
            issues.append("Redis URL should be configured for production")
        
        if not config.backup_enabled:
            issues.append("Consider enabling backups in production")
    
    if config.enable_redis and not config.redis.password and config.environment in [Environment.STAGING, Environment.PRODUCTION]:
        issues.append("Redis password should be set in staging/production")
    
    return issues